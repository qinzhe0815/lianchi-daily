import Foundation
import Security
import Capacitor

private final class KeychainVault: SecretVault {
    private let service = (Bundle.main.bundleIdentifier ?? "com.abigcyan.lianchi") + ".ai"
    private func query(_ id: String? = nil) -> [String: Any] {
        var q: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service]
        if let id = id { q[kSecAttrAccount as String] = id }
        return q
    }
    private func check(_ status: OSStatus) throws {
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw NSError(domain: NSOSStatusErrorDomain, code: Int(status), userInfo: [NSLocalizedDescriptionKey: "Keychain 访问失败（\(status)）"])
        }
    }
    func read(_ id: String) throws -> String? {
        var q = query(id); q[kSecReturnData as String] = true; q[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(q as CFDictionary, &result); try check(status)
        guard status != errSecItemNotFound, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    func write(_ value: String, id: String) throws {
        var q = query(id); q[kSecValueData as String] = Data(value.utf8)
        q[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        try check(SecItemAdd(q as CFDictionary, nil))
    }
    func remove(_ id: String) throws { try check(SecItemDelete(query(id) as CFDictionary)) }
    func clear() throws { try check(SecItemDelete(query() as CFDictionary)) }
}

@objc(PersistentStorePlugin)
public class PersistentStorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PersistentStorePlugin"
    public let jsName = "PersistentStore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "load", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "save", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise)
    ]
    private let worker = DispatchQueue(label: "com.abigcyan.lianchi.storage")
    private lazy var store: DurableStore = {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return DurableStore(url: base.appendingPathComponent("Lianchi/state.json"), vault: KeychainVault())
    }()
    @objc func load(_ call: CAPPluginCall) {
        worker.async { do { call.resolve(["data": try self.store.load()]) } catch { call.reject("无法恢复本机数据：\(error.localizedDescription)") } }
    }
    @objc func save(_ call: CAPPluginCall) {
        guard let data = call.getObject("data") as? [String: String] else { call.reject("数据格式无效"); return }
        worker.async { do { try self.store.save(data); call.resolve() } catch { call.reject("无法保存本机数据：\(error.localizedDescription)") } }
    }
    @objc func clear(_ call: CAPPluginCall) {
        worker.async { do { try self.store.clear(); call.resolve() } catch { call.reject("无法清除本机数据：\(error.localizedDescription)") } }
    }
}
