import Foundation
import Capacitor
import MediaPlayer
import UIKit
import AVFoundation

@objc(NowPlayingPlugin)
public class NowPlayingPlugin: CAPPlugin, CAPBridgedPlugin {

    // MARK: - Capacitor Plugin

    public let identifier = "NowPlayingPlugin"

    public let jsName = "NowPlaying"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(
            name: "update",
            returnType: CAPPluginReturnPromise
        ),
        CAPPluginMethod(
            name: "clear",
            returnType: CAPPluginReturnPromise
        )
    ]

    private var cachedImage: UIImage?

    // 「枠内」と「拡大表示」を見分けるためのしきい値（ポイント）。
    //
    // 重要：この値は実機での実際のログを見ながら調整する必要がある。
    // update() のたびに [Native] artwork requested size: の
    // ログが出るので、
    //   ・ロック画面の枠内で再生した時のサイズ
    //   ・画像をタップして拡大表示した時のサイズ
    // を両方確認し、その中間くらいの値に変更すること。
    private static let expandedSizeThreshold: CGFloat = 300

    // 枠内表示時、正方形の周りに入れる余白の割合（0〜0.4程度）。
    // 大きいほど、枠の中の画像が小さく見える。
    private static let compactPaddingRatio: CGFloat = 0.2

    // 「曲の長さ」として渡す、便宜上の値（24時間）。
    private static let fakeDuration: TimeInterval = 24 * 60 * 60

    // MARK: - Plugin Load

    override public func load() {
        super.load()

        setupRemoteCommands()

        DispatchQueue.main.async {
            UIApplication.shared.beginReceivingRemoteControlEvents()
        }

        print(
            "[Native] Now Playing plugin loaded"
        )
    }

    // MARK: - Audio Session

    private func activateAudioSession() {

        do {

            try AVAudioSession.sharedInstance().setCategory(
                .playback,
                options: []
            )

            try AVAudioSession.sharedInstance().setActive(true)

            print(
                "[Native] AVAudioSession activated"
            )

        } catch {

            print(
                "[Native] AVAudioSession activate error:",
                error
            )

        }

    }

    // MARK: - Artwork Decode

    private static func decodeArtwork(
        _ value: String
    ) -> UIImage? {

        let base64String: String

        if let commaIndex = value.firstIndex(of: ",") {

            base64String = String(
                value[value.index(after: commaIndex)...]
            )

        } else {

            base64String = value

        }

        guard let data = Data(
            base64Encoded: base64String
        ) else {

            print(
                "[Native] artwork base64 decode failed"
            )

            return nil

        }

        return UIImage(data: data)

    }

    // MARK: - Artwork：正方形クロップ＋余白（枠内・小さい表示用）

    private static func squareCroppedWithPadding(
        _ image: UIImage,
        to size: CGSize
    ) -> UIImage {

        guard size.width > 0, size.height > 0 else {
            return image
        }

        let renderer = UIGraphicsImageRenderer(size: size)

        return renderer.image { _ in

            let side = min(image.size.width, image.size.height)

            let cropRect = CGRect(
                x: (image.size.width - side) / 2,
                y: (image.size.height - side) / 2,
                width: side,
                height: side
            )

            guard let cgImage = image.cgImage,
                  let cropped = cgImage.cropping(to: cropRect) else {

                image.draw(
                    in: CGRect(origin: .zero, size: size)
                )

                return

            }

            let croppedImage = UIImage(
                cgImage: cropped,
                scale: image.scale,
                orientation: image.imageOrientation
            )

            // 周囲に余白を入れて、実際に見える画像を小さくする
            let inset = size.width * compactPaddingRatio

            let drawRect = CGRect(
                x: inset,
                y: inset,
                width: size.width - inset * 2,
                height: size.height - inset * 2
            )

            croppedImage.draw(in: drawRect)

        }

    }

    // MARK: - Artwork：アスペクト比を保ったまま収める（拡大表示用）

    private static func aspectFit(
        _ image: UIImage,
        within size: CGSize
    ) -> UIImage {

        guard size.width > 0, size.height > 0 else {
            return image
        }

        let widthRatio = size.width / image.size.width
        let heightRatio = size.height / image.size.height
        let scale = min(widthRatio, heightRatio)

        let targetSize = CGSize(
            width: image.size.width * scale,
            height: image.size.height * scale
        )

        let renderer = UIGraphicsImageRenderer(size: targetSize)

        return renderer.image { _ in

            image.draw(
                in: CGRect(origin: .zero, size: targetSize)
            )

        }

    }

    // MARK: - Publish Now Playing Info

    private func publishNowPlayingInfo(
        title: String,
        subtitle: String,
        playing: Bool
    ) {

        var info = [String: Any]()

        info[MPMediaItemPropertyTitle] = title
        info[MPMediaItemPropertyArtist] = "Būte"

        if !subtitle.isEmpty {
            info[MPMediaItemPropertyAlbumTitle] = subtitle
        }

        info[MPNowPlayingInfoPropertyPlaybackRate] =
            playing ? 1.0 : 0.0

        info[MPNowPlayingInfoPropertyDefaultPlaybackRate] = 1.0

        info[MPMediaItemPropertyPlaybackDuration] = Self.fakeDuration
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = 0

        if let baseImage = cachedImage {

            // boundsSizeは元画像（縦長）の比率をそのまま伝える。
            // 実際にどう見せるかは、要求サイズに応じて
            // クロージャ内で判断する。
            let artwork = MPMediaItemArtwork(
                boundsSize: baseImage.size
            ) { requestedSize in

                // どのサイズが要求されたかを確認するためのログ。
                // 実機でこの値を見て、閾値(expandedSizeThreshold)を調整する。
                print(
                    "[Native] artwork requested size:",
                    requestedSize
                )

                let maxSide = max(requestedSize.width, requestedSize.height)

                if maxSide > Self.expandedSizeThreshold {

                    // 拡大表示：元の縦長画像をそのまま見せる
                    return Self.aspectFit(baseImage, within: requestedSize)

                } else {

                    // 枠内の小さい表示：正方形＋余白
                    return Self.squareCroppedWithPadding(baseImage, to: requestedSize)

                }

            }

            info[MPMediaItemPropertyArtwork] = artwork

        }

        MPNowPlayingInfoCenter.default().nowPlayingInfo = info

        MPNowPlayingInfoCenter.default().playbackState =
            playing ? .playing : .paused

        let finalInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]

        print("[Native] Now Playing updated:", title, "playing:", playing)
        print("[Native] final artwork exists:", finalInfo[MPMediaItemPropertyArtwork] != nil)
        print("[Native] final keys:", Array(finalInfo.keys))

    }

    // MARK: - Now Playing

    @objc public func update(
        _ call: CAPPluginCall
    ) {
        let title =
            call.getString("title")
            ?? "Būte"

        let subtitle =
            call.getString("subtitle")
            ?? ""

        let playing =
            call.getBool("playing")
            ?? false

        let artworkString =
            call.getString("artwork")


        if playing {

            activateAudioSession()

        }


        if let artworkString = artworkString,
           let image = Self.decodeArtwork(artworkString) {

            cachedImage = image

            print(
                "[Native] artwork decoded, size:",
                image.size
            )

        }


        let commandCenter =
            MPRemoteCommandCenter.shared()

        commandCenter.playCommand.isEnabled = !playing
        commandCenter.pauseCommand.isEnabled = playing
        commandCenter.togglePlayPauseCommand.isEnabled = true

        commandCenter.stopCommand.isEnabled = false
        commandCenter.nextTrackCommand.isEnabled = false
        commandCenter.previousTrackCommand.isEnabled = false
        commandCenter.skipForwardCommand.isEnabled = false
        commandCenter.skipBackwardCommand.isEnabled = false
        commandCenter.changePlaybackPositionCommand.isEnabled = false

        print("[Native] play enabled:", commandCenter.playCommand.isEnabled)
        print("[Native] pause enabled:", commandCenter.pauseCommand.isEnabled)
        print("[Native] has artwork:", cachedImage != nil)


        publishNowPlayingInfo(
            title: title,
            subtitle: subtitle,
            playing: playing
        )


        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { [weak self] in

            self?.publishNowPlayingInfo(
                title: title,
                subtitle: subtitle,
                playing: playing
            )

        }

        call.resolve()
    }

    // MARK: - Clear Now Playing

    @objc public func clear(
        _ call: CAPPluginCall
    ) {
        cachedImage = nil

        MPNowPlayingInfoCenter
            .default()
            .nowPlayingInfo = nil

        MPNowPlayingInfoCenter
            .default()
            .playbackState = .stopped

        try? AVAudioSession.sharedInstance().setActive(
            false,
            options: .notifyOthersOnDeactivation
        )

        print(
            "[Native] Now Playing cleared"
        )

        call.resolve()
    }

    // MARK: - Remote Commands

    private func setupRemoteCommands() {

        let commandCenter =
            MPRemoteCommandCenter.shared()

        commandCenter.playCommand.isEnabled = true

        commandCenter.playCommand.addTarget {
            [weak self] _ in

            print("[Native] Remote PLAY")

            self?.bridge?.triggerWindowJSEvent(
                eventName: "NowPlayingRemotePlay"
            )

            return .success
        }

        commandCenter.pauseCommand.isEnabled = true

        commandCenter.pauseCommand.addTarget {
            [weak self] _ in

            print("[Native] Remote PAUSE")

            self?.bridge?.triggerWindowJSEvent(
                eventName: "NowPlayingRemotePause"
            )

            return .success
        }

        commandCenter.togglePlayPauseCommand.isEnabled = true

        commandCenter.togglePlayPauseCommand.addTarget {
            [weak self] _ in

            print("[Native] Remote TOGGLE PLAY/PAUSE")

            self?.bridge?.triggerWindowJSEvent(
                eventName: "NowPlayingRemoteToggle"
            )

            return .success
        }

        commandCenter.stopCommand.isEnabled = false
        commandCenter.nextTrackCommand.isEnabled = false
        commandCenter.previousTrackCommand.isEnabled = false
        commandCenter.skipForwardCommand.isEnabled = false
        commandCenter.skipBackwardCommand.isEnabled = false
        commandCenter.changePlaybackPositionCommand.isEnabled = false

        print(
            "[Native] Now Playing remote commands configured"
        )
    }
}
