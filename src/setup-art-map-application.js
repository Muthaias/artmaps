function setupArtMapApplication(initialSources, mainId, contentId, sourcesId, ) {
    const dataService = new DataService([
        {
            id: "default",
            load: (init, entriesCallback, groupsCallback) => {
                try {
                    const entries = DataUtility.dataToEntries(mapData);
                    const groups = DataUtility.dataToGroups(mapData);
                    entriesCallback(entries);
                    groupsCallback(groups);
                } catch (e) {
                    entriesCallback([]);
                    groupsCallback([]);
                }
            },
        },
        {
            id: "basic_api",
            load: async (init, entriesCallback, groupsCallback) => {
                const rootUrl = (init.rootUrl + "/").replace(/\/\/$/g, "/");
                console.log(rootUrl);
                fetch(rootUrl + "entries.json").then(response => response.json()).then(entries => {
                    entriesCallback(entries);
                }).catch(() => entriesCallback([]));
                fetch(rootUrl + "groups.json").then(response => response.json()).then(groups => {
                    groupsCallback(groups);
                }).catch(() => groupsCallback([]));
            }
        }
    ]);

    const entryMap = L.map('mapid', {
        zoom: 15,
        zoomControl: true
    });
    const initialSettings = {
        sources: initialSources.map((s, index) => ({
            uid: "_source_default_" + index,
            id: "basic_api",
            init: {
                rootUrl: s
            }
        }))
    };
    const settingService = new SettingService("standard3", true, initialSettings);
    const uiControl = new UIControl(mainId, contentId, sourcesId, entryMap, dataService, settingService);
    uiControl.init().then(() => {
        uiControl.render();
    });
}