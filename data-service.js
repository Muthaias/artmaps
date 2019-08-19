class DataSource {
    constructor(init, load, uid) {
        this._load = load || ((entryCallback, groupsCallback) => {
            entryCallback([]);
            groupsCallback([]);
        });
        this._init = init;

        this._entries = [];
        this._groups = [];
        this._isLoaded = false;
        this._uid = uid;
    }

    load() {
        return new Promise((resolve, reject) => {
            let entries = null;
            let groups = null;
            const collect = () => {
                if (entries && groups) {
                    this._entries = entries;
                    this._groups = groups;
                    resolve();
                }
            };
            this._load(
                this._init,
                (e, error) => {
                    if (error) reject(error);
                    entries = e;
                    collect();
                },
                (g, error) => {
                    if (error) reject(error);
                    groups = g;
                    collect();
                }
            );
        });
    }

    get isLoaded() {
        return this._isLoaded;
    }

    get entries() {
        return this._entries;
    }

    get groups() {
        return this._groups;
    }

    get uid() {
        return this._uid;
    }
}

class DataService {
    constructor(dataAdapters) {
        this._dataAdapters = dataAdapters || [
            {
                id: "empty",
                load: ((_, entryCallback, groupsCallback) => {
                    entryCallback([]);
                    groupsCallback([]);
                }),
            }
        ];
        this._dataSources = [];
    }

    addSource(id, init, uid) {
        const adapter = this._dataAdapters.filter(a => a.id === id)[0];
        if (adapter && (!uid || !this._dataSources.find(ds => ds.uid === uid))) {
            this._dataSources.push(new DataSource(init, adapter.load, uid));
        } else {
            console.warn("Could not find adapter with id: " + id);
        }
    }

    removeSource(uid) {
        this._dataSources = this._dataSources.filter(ds => ds.uid !== uid);
    }

    load() {
        const loads = this._dataSources.filter(ds => !ds.isLoaded).map(ds => ds.load());
        return Promise.all(loads);
    }

    get entries() {
        return this._dataSources.reduce((acc, ds) => acc.concat(ds.entries), []);
    }

    get groups() {
        return this._dataSources.reduce((acc, ds) => acc.concat(ds.groups), []);
    }
}