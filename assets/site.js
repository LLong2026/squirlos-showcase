/* Live figures come from the containment feed in the public repo.
   Rule: a number is never shown as live unless the fetch actually returned.
   If the feed fails, the static values already in the HTML stand, and the
   source line says so instead of pretending to be current. */

(function () {
  var FEED = 'https://raw.githubusercontent.com/LLong2026/four-horsemen-public/main/cage_watch_feed.json';
  var line = document.getElementById('feed-line');
  var fields = {
    cycles: document.querySelector('[data-live="cycles"]'),
    falsifiers: document.querySelector('[data-live="falsifiers"]'),
    escapes: document.querySelector('[data-live="escapes"]'),
    gate: document.querySelector('[data-live="gate"]')
  };

  function stamp(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    try {
      return d.toLocaleString('en-US', {
        timeZone: 'America/Chicago', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }) + ' CT';
    } catch (e) { return d.toISOString(); }
  }

  function fail(reason) {
    if (!line) return;
    line.textContent = 'Feed unreachable (' + reason + '). The figures above are the last recorded values from 2026-11-18 and are not live.';
    line.classList.add('stale');
  }

  var controller = ('AbortController' in window) ? new AbortController() : null;
  var timer = setTimeout(function () { if (controller) controller.abort(); }, 9000);

  fetch(FEED + '?t=' + Date.now(), controller ? { cache: 'no-store', signal: controller.signal } : { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (d) {
      clearTimeout(timer);
      var t = d.totals || {};
      if (fields.cycles && typeof t.recorded_cycles === 'number') fields.cycles.textContent = t.recorded_cycles;
      if (fields.falsifiers && t.falsifiers_held) fields.falsifiers.textContent = t.falsifiers_held;
      if (fields.escapes && typeof t.escapes === 'number') fields.escapes.textContent = t.escapes;
      if (fields.gate && d.gate_version && d.gate_version.current) fields.gate.textContent = d.gate_version.current;
      if (line) {
        line.textContent = 'Live from the containment feed, updated ' + stamp(d.updated_at) +
          '. Percentages on the dashboard are computed from receipted counts only.';
        line.classList.remove('stale');
      }
    })
    .catch(function (e) {
      clearTimeout(timer);
      fail(e && e.name === 'AbortError' ? 'timed out' : (e && e.message) || 'unknown error');
    });
})();
