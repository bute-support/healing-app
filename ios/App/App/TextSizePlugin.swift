import UIKit
import Capacitor

@objc(TextSizePlugin)
public class TextSizePlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "TextSizePlugin"
    public let jsName = "TextSize"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(
            name: "getScale",
            returnType: CAPPluginReturnPromise
        )
    ]

    override public func load() {
        super.load()

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(contentSizeCategoryChanged),
            name: UIContentSizeCategory.didChangeNotification,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func contentSizeCategoryChanged() {
        notifyListeners(
            "textSizeChanged",
            data: [
                "scale": currentScale()
            ]
        )
    }

    @objc func getScale(_ call: CAPPluginCall) {
        call.resolve([
            "scale": currentScale(),
            "category": UIApplication.shared.preferredContentSizeCategory.rawValue
        ])
    }

    private func currentScale() -> Double {
        let category = UIApplication.shared.preferredContentSizeCategory

        let traits = UITraitCollection(
            preferredContentSizeCategory: category
        )

        let baseSize: CGFloat = 16

        let scaledSize = UIFontMetrics.default.scaledValue(
            for: baseSize,
            compatibleWith: traits
        )

        return Double(scaledSize / baseSize)
    }
}