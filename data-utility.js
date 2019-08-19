class DataUtility {
    static loadSettings(settingId) {
        let settings = null;
        try {
            const data = window.localStorage.getItem("am_settings_" + settingId);
            settings = JSON.parse(data);
        } catch (e) {}

        return settings || {
            sources: [
                {
                    id: "basic_api",
                    init: {
                        rootUrl: "api/"
                    }
                },
            ],
        };
    }

    static storeSettings(settingId, settings) {
        window.localStorage.setItem("am_settings_" + settingId, JSON.stringify(settings));
    }

    static dataToEntries(data) {
        return data.reduce((acc, group) => {
            return acc.concat(
                    group.entries.map(e => Object.assign(
                        {},
                        e,
                        {
                            groupId: group.id,
                            lat: parseFloat(e.lat),
                            long: parseFloat(e.long),
                        }
                    )
                )
            );
        }, []);
    }

    static dataToGroups(data) {
        return data.map(group => Object.assign(
                {},
                group.info,
                {
                    id: group.id,
                }
            )
        );
    }

    static getGroup(data, groupId) {
        return data.filter(group => group.id === groupId)[0].info;
    }

    static getEntries(data, groupId) {
        return data.filter(group => group.id === groupId)[0].entries;
    }

    static getCenter(entries) {
        let clusterCenter = entries.reduce((acc, entry) => {
            return acc ? (
                {
                    lat: entry.lat + acc.lat,
                    long: entry.long + acc.long,
                }
            ) : (
                {
                    lat: entry.lat,
                    long: entry.long,
                }
            );
        }, null);
        clusterCenter.lat /= entries.length;
        clusterCenter.long /= entries.length;
        return clusterCenter;
    }

    static dynamicEntryInfo(entry) {
        let date = new Date();
        let now = date.getFullYear();
        let yearOfDeath = entry.yearOfDeath;
        let diff = (now - yearOfDeath);
        let left = (70 - parseInt(diff));
        let passed = (70 + parseInt(yearOfDeath));

        let status = "unknown";
        if (yearOfDeath == 0) {
            status = "alive";
        }
        else if (diff < 60) {
            status = "blocked";
        }
        else if (diff > 59 && diff < 70) {
            status = "warning";
        }
        else if (diff > 69) {
            status = "open";
        }

        return Object.assign({}, entry, {
            now: now,
            diff: diff,
            left: left,
            passed: passed,
            status: status,
        });
    }

    static applyEntryToInfo(entry, info) {
        return Object.keys(entry).reduce((acc, id) => {
            return acc.replace(new RegExp("\{" + id + "\}"), entry[id]);
        }, info);
    }

    static mapView(entryMap, group, entries) {
        entryMap.eachLayer((layer) => {
            entryMap.removeLayer(layer);
        });
        let ColorfulIcon = L.Icon.extend({
            options: {
                // shadowUrl: 'red_pin.png',
                iconSize: [27, 42],
                shadowSize: [50, 64],
                iconAnchor: [13, 48],
                shadowAnchor: [4, 62],
                popupAnchor: [0, -35]
            }
        });

        let greenIcon = new ColorfulIcon({ iconUrl: 'img/green_pin.png' });
        let redIcon = new ColorfulIcon({ iconUrl: 'img/red_pin.png' });
        let orangeIcon = new ColorfulIcon({ iconUrl: 'img/yellow_pin.png' });
        let iconMap = {
            warning: orangeIcon,
            alive: redIcon,
            blocked: redIcon,
            unknown: redIcon,
            open: greenIcon
        }
        let baseInfo = "{artwork} by {creator} in {installation}.";
        let infoMap = {
            warning: baseInfo + " The work will be in the public domain in <b>{left} years</b>. <br><br> {description}",
            alive: baseInfo + " <b>The artist is still alive.</b> The work will be in the public domain 70 years after the death of the artist. <br><br> {description}",
            blocked: baseInfo + " The work will be in the public domain in <b>{left} years</b>. <br><br> {description}",
            unknown: baseInfo + " The public domain status of this work is unclear. <br><br> {description}",
            open: baseInfo + " The work is in the public domain since {passed}. <br><br> {description}",
        }

        let clusterCenter = group.position || DataUtility.getCenter(entries);
        L.tileLayer(
            'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw',
            {
                maxZoom: 19,
                attribution: [
                    'Kartdata &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>-deltagare',
                    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
                    'Konstdata &copy; <a href="https://sv.wikipedia.org/wiki/Lista_%C3%B6ver_offentlig_konst_i_uppsala">Wikipedia</a>-deltagare',
                    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>' + 'Imagery © <a href="http://mapbox.com">Mapbox</a>'
                ].join(", "),
                id: 'mapbox.streets'
            }
        ).addTo(entryMap);

        entries.forEach((entry) => {
            let info = DataUtility.applyEntryToInfo(entry, infoMap[entry.status]);
            let icon = iconMap[entry.status];
            let artwork = L.marker([entry.lat, entry.long], { icon: icon }).addTo(entryMap);
            artwork.bindPopup(info).openPopup();
        });
        entryMap.setView([clusterCenter.lat, clusterCenter.long], group.zoom || 15);
    }
}