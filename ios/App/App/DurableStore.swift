import Foundation

protocol SecretVault {
    func read(_ id: String) throws -> String?
    func write(_ value: String, id: String) throws
    func remove(_ id: String) throws
    func clear() throws
}

/// 原子快照仅保存普通记录；凭据存储在独立的 Keychain 中。
final class DurableStore {
    private struct Snapshot: Codable {
        var version: Int = 1
        var data: [String: String]
        var credentialID: String?
    }
    private let url: URL
    private let vault: SecretVault
    init(url: URL, vault: SecretVault) { self.url = url; self.vault = vault }

    private func snapshot() throws -> Snapshot {
        guard FileManager.default.fileExists(atPath: url.path) else { return Snapshot(data: [:]) }
        let state = try JSONDecoder().decode(Snapshot.self, from: Data(contentsOf: url))
        guard state.version == 1 else { throw error("不支持的存储版本") }
        return state
    }
    private func error(_ message: String) -> NSError {
        NSError(domain: "LianchiStorage", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
    }
    private func aiObject(_ raw: String) throws -> [String: Any] {
        guard let object = try JSONSerialization.jsonObject(with: Data(raw.utf8)) as? [String: Any] else {
            throw error("接口资料无效")
        }
        return object
    }
    private func json(_ object: [String: Any]) throws -> String {
        String(decoding: try JSONSerialization.data(withJSONObject: object, options: [.sortedKeys]), as: UTF8.self)
    }
    func load() throws -> [String: String] {
        let state = try snapshot()
        var data = state.data
        if let id = state.credentialID {
            guard let raw = data["lcd:ai"] else { throw error("接口资料缺失") }
            // 换机备份不会恢复 ThisDeviceOnly 凭据；普通记录仍可读取。
            let secret = try vault.read(id) ?? ""
            var ai = try aiObject(raw); ai["key"] = secret; data["lcd:ai"] = try json(ai)
        }
        return data
    }
    func save(_ values: [String: String]) throws {
        let previous = try snapshot()
        var data = values.filter { $0.key.hasPrefix("lcd:") }, id: String?
        if let raw = data["lcd:ai"] {
            var ai = try aiObject(raw)
            let key = ai.removeValue(forKey: "key") as? String ?? ""
            data["lcd:ai"] = try json(ai)
            if !key.isEmpty {
                if let oldID = previous.credentialID, try vault.read(oldID) == key { id = oldID }
                else { id = UUID().uuidString; try vault.write(key, id: id!) }
            }
        }
        do {
            let encoded = try JSONEncoder().encode(Snapshot(data: data, credentialID: id))
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            #if os(iOS)
            try encoded.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
            #else
            try encoded.write(to: url, options: .atomic)
            #endif
        } catch {
            if let newID = id, newID != previous.credentialID { try? vault.remove(newID) }
            throw error
        }
        if let oldID = previous.credentialID, oldID != id { try? vault.remove(oldID) }
    }
    func clear() throws {
        try vault.clear()
        if FileManager.default.fileExists(atPath: url.path) { try FileManager.default.removeItem(at: url) }
    }
}
