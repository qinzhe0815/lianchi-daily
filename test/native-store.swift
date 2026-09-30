import Foundation

final class MemorySecrets: SecretVault {
    var values: [String: String] = [:]
    var fail = false
    var failRead = false
    func read(_ id: String) throws -> String? { if failRead { throw NSError(domain: "test", code: 2) }; return values[id] }
    func write(_ value: String, id: String) throws { if fail { throw NSError(domain: "test", code: 1) }; values[id] = value }
    func remove(_ id: String) throws { values.removeValue(forKey: id) }
    func clear() throws { values.removeAll() }
}

func check(_ value: Bool) { precondition(value) }

@main struct NativeStoreTests {
    static func main() throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: dir) }
        let url = dir.appendingPathComponent("state.json"), vault = MemorySecrets()
        let store = DurableStore(url: url, vault: vault)
        check(try store.load().isEmpty)
        let data = ["lcd:ai": "{\"key\":\"secret-for-test\",\"base\":\"https://example.org\"}", "lcd:profile": "{\"weight\":80}"]
        try store.save(data)
        check(!(try String(contentsOf: url, encoding: .utf8)).contains("secret-for-test"))
        let restored = try DurableStore(url: url, vault: vault).load()
        let ai = try JSONSerialization.jsonObject(with: Data(restored["lcd:ai"]!.utf8)) as! [String: String]
        check(ai["key"] == "secret-for-test")
        let originalSecrets = vault.values
        vault.values = [:]
        let migrated = try store.load()
        check(migrated["lcd:profile"] == data["lcd:profile"])
        let migratedAI = try JSONSerialization.jsonObject(with: Data(migrated["lcd:ai"]!.utf8)) as! [String: String]
        check(migratedAI["key"] == "")
        vault.values = originalSecrets
        vault.failRead = true
        do { _ = try store.load(); fatalError("vault access errors must remain visible") } catch {}
        vault.failRead = false
        vault.fail = true
        do { try store.save(["lcd:ai": "{\"key\":\"replacement\"}"]); fatalError("failed vault must prevent save") } catch {}
        check(try store.load()["lcd:profile"] == data["lcd:profile"])
        vault.fail = false
        try store.save(["lcd:profile": "{\"weight\":79}"])
        check(vault.values.isEmpty)
        let committed = try Data(contentsOf: url)
        do { try store.save(["lcd:ai": "bad json"]); fatalError("invalid credentials must fail") } catch {}
        check(try Data(contentsOf: url) == committed)
        try Data("corrupt".utf8).write(to: url)
        do { _ = try store.load(); fatalError("corrupt state must not become empty data") } catch {}
        try store.clear()
        check(!FileManager.default.fileExists(atPath: url.path)); check(vault.values.isEmpty)
        print("Swift 原生存储：凭据隔离、重启恢复、失败保护、损坏检测与清除通过")
    }
}
