class UIControl {
	constructor(navId, contentId, settingsId, entryMap, dataService, settingService) {
		this._navId = navId;
        this._contentId = contentId;
        this._settingsId = settingsId;
		this._entryMap = entryMap;

		this._groups = [];
        this._entries = [];
        this._currentGroupId = (this._groups[0] || {}).id;
        this._showContent = true;

        this._dataService = dataService;
        this._settingService = settingService;
    }

	get currentGroup() {
		return this._groups.filter(g => g.id === this._currentGroupId)[0] || {
            id: "_empty",
            name: "No groups available",
            position: {
                lat: 0,
                long: 0,
            }
        };
	}

	get currentEntries() {
		return this._entries.filter(e => e.groupId === this._currentGroupId).map(entry => DataUtility.dynamicEntryInfo(entry));
    }
    
    init() {
        const sources = this._settingService.settings.sources;
        sources.forEach((s) => {
            this._dataService.addSource(s.id, s.init, s.uid);
        });
        return this._dataService.load().then(() => {
            this._groups = this._dataService.groups;
            this._entries = this._dataService.entries;
            this._currentGroupId = (this._groups[0] || {}).id;
        });
    }

	setGroup(groupId) {
		this._currentGroupId = groupId,
		this.render();
	}

	toggleContent() {
		this._showContent = !this._showContent;
		this.updateNavigation();
    }
    
    addBaseApi() {
        const rootUrl = prompt("Input root URL:");
        if (rootUrl) {
            this._settingService.addSource("basic_api", {
                rootUrl: rootUrl,
            });
            this.init().then(() => {
                this.render();
            });
        }
    }

    removeSource(source) {
        const shouldRemove = confirm("Do you really want to remove this source?");
        if (shouldRemove) {
            this._settingService.removeSource(source.uid);
            this._dataService.removeSource(source.uid);
            this.init().then(() => {
                this.render();
            });
        }
    }

	updateNavigation() {
		document.title = DataUtility.applyEntryToInfo(
			this.currentGroup,
			"Map of public artwork for {name}"
		);
		UIControl.renderNavigation(
			this._navId,
			this._groups,
			this._currentGroupId,
			this._showContent,
			(group) => {
				this.setGroup(group.id);
			},
			() => {
				this.toggleContent();
            }
		);
		if (!this._showContent) {
			$("#" + this._contentId).addClass("hidden");
		} else {
			$("#" + this._contentId).removeClass("hidden");
		}
    }
    
    updateSettings() {
        UIControl.renderSettings(
            this._settingsId,
            this._settingService.settings.sources,
            (source) => {
                console.log(source);
                this.removeSource(source);
            },
            () => {
                this.addBaseApi();
            }
        );
    }

	updateMap() {
		UIControl.renderMapView(
			this._entryMap,
			this.currentGroup,
			this.currentEntries,
		);
	}

	render() {
        this.updateNavigation();
        this.updateSettings();
		this.updateMap();
    }
    
    static renderSettings(rootId, sources, onRemoveSource, onAddSource) {
        let element = $("#" + rootId);
        element.empty();
        sources.forEach((s) => {
			let navElement = $('<span class="source"> Remove: ' + s.init.rootUrl + '</span>');
			navElement.click(() => {
				onRemoveSource(s);
			});
			element.append(navElement);
        });

        let navElement = $('<span class="source add">Add source</span>');
        navElement.click(() => {
            onAddSource();
        });
        element.append(navElement);
    }

	static renderMapView(entryMap, group, entries) {
		DataUtility.mapView(entryMap, group, entries);
	}

	static renderNavigation(rootId, groups, currentGroupId, showContent, onClick, onContentToggle) {
		let element = $("#" + rootId);
		element.empty();
		groups.forEach((g) => {
			let active = currentGroupId === g.id ? " active" : "";
			let navElement = $('<span class="nav-item' + active + '">' + g.name + '</span>');
			navElement.click(() => {
				onClick(g);
			});
			element.append(navElement);
        });

		let active = showContent ? " active" : "";
		let contentToggle = $('<span id="nav-content-toggle" class="' + active + '"></span>');
		contentToggle.click(onContentToggle);
		element.append(contentToggle);
	}
}