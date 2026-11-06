import UIKit
import Capacitor

class MyViewController: CAPBridgeViewController {

    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(NowPlayingPlugin())
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // iOS画面本体の背景色
        self.view.backgroundColor = UIColor(
            red: 248.0 / 255.0,
            green: 251.0 / 255.0,
            blue: 255.0 / 255.0,
            alpha: 1.0
        )

        // WebViewの背景色
        self.webView?.isOpaque = false
        self.webView?.backgroundColor = self.view.backgroundColor

        // スクロール時の跳ね返りを無効化
        self.webView?.scrollView.bounces = false
        self.webView?.scrollView.alwaysBounceVertical = false
        self.webView?.scrollView.alwaysBounceHorizontal = false
    }

}