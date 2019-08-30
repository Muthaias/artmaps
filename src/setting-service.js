class SettingService {
    constructor(id, useLocaleStorage = true, initialSettings = null) {
        this._id = id;
        this._useLocalStorage = useLocaleStorage;
        this._settings = this.loadSettings() || initialSettings || this._defaultSettings();
    }

    get settings() {
        return this._settings;
    }

    loadSettings() {
        const settingId = this._id;
        let settings = null;
        if (this._useLocalStorage) {
            try {
                const data = window.localStorage.getItem("am_settings_" + settingId);
                settings = JSON.parse(data);
            } catch (e) {}
        }
        return settings;
    }

    storeSettings(settings) {
        const settingId = this._id;
        if (this._useLocalStorage) {
            window.localStorage.setItem("am_settings_" + settingId, JSON.stringify(settings));
        }
    }

    addSource(id, init) {
        const uid = "_source_" + Date.now() + "_" + this._settings.sources.length;
        this._settings.sources.push({
            uid: uid,
            id: id,
            init: init,
        });
        this.storeSettings(this._settings);
        return uid;
    }

    removeSource(uid) {
        this._settings.sources = this._settings.sources.filter(s => s.uid !== uid);
        this.storeSettings(this._settings);
    }

    static _defaultSettings() {
        return {
            sources: [
                {
                    uid: "_source_default",
                    id: "basic_api",
                    init: {
                        rootUrl: "api/"
                    }
                },
            ],
        };
    }
}