var axios = require("axios");

module.exports = function () {
  return axios
    .get("https://results.picoevents.ch/api/liveevents.php")
    .then(function (response) {
      if (response.status !== 200) {
        res.status(500);
        res.json({ error: "backend server reported a problem" });
        return;
      }

      var json = response.data;

      return json.liveevents.map(function (entry) {
        return {
          id: entry.folder,
          name: entry.name,
          date: entry.date,
          map: entry.map,
          club: entry.organizer,
          laststart: entry.laststart,
          source: "picoevents",
          _link: "http://ol.zimaa.ch/api/events/picoevents/" + entry.folder,
        };
      });
    });
}
