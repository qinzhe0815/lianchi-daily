import Capacitor

final class LianchiViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(PersistentStorePlugin())
    }
}
