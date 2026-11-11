/* ===== Dashboards: admin / teacher / student =====
   Load this AFTER app.js. It replaces the old dashboard functions. */

/* ---------- helpers ---------- */
function greetingNow(){
  const h = Number(manilaNow().time.slice(0,2));
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
function todayLabel(){
  return new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',weekday:'long',month:'long',day:'numeric'}).format(new Date());
}
function logTime(ts){
  const d = new Date(ts);
  if(isNaN(d)) return timeAgo(ts);
  return timeAgo(ts) + ' · ' + d.toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'});
}
function dayLabel(dateStr){
  const today = manilaNow().date;
  const t = new Date(today + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + 1);
  const tomorrow = t.toISOString().slice(0,10);
  if(dateStr === today) return 'Today';
  if(dateStr === tomorrow) return 'Tomorrow';
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',weekday:'short',month:'short',day:'numeric'});
}
function welcomeBanner(title, subtitle, ic){
  return `
    <div class="welcome-banner">
      <div><h2>${title}</h2><p>${subtitle}</p></div>
      <div style="font-size:48px; opacity:0.15; color:#fff;">${icon(ic)}</div>
    </div>`;
}
function statCard({color, ic, label, value, go, valueStyle=''}){
  return `
    <div class="stat-card"${go ? ` style="cursor:pointer;" onclick="${go}"` : ''}>
      <div class="stat-icon ${color}">${icon(ic)}</div>
      <div class="stat-content">
        <div class="label">${label}</div>
        <div class="value" style="${valueStyle}">${value}</div>
      </div>
    </div>`;
}
function avatarBig(user, size=48){
  const photo = user && user.profile_image;
  const style = `width:${size}px;height:${size}px;font-size:${Math.round(size*.38)}px;` + (photo ? '' : 'background:#EEF2FF;color:var(--forest);');
  return `<div class="avatar${photo ? ' has-photo' : ''}" style="${style}">${photo ? `<img src="${photo}" alt="${escapeAttr(user.name)}">` : initials(user && user.name)}</div>`;
}
function activityTimeline(logs, emptyText){
  if(logs.length === 0) return `<p class="hint">${emptyText}</p>`;
  return `<div class="timeline">${logs.map(l => `
    <div class="timeline-item">
      <div class="timeline-dot ${l.action === 'check-in' ? 'in' : 'out'}">${icon(l.action === 'check-in' ? 'check' : 'arrowRight')}</div>
      <div class="timeline-content">
        <div class="timeline-title"><strong>${l.teacher_name}</strong> ${l.action === 'check-in' ? 'checked into' : 'left'} <strong>${l.room_name}</strong></div>
        <div class="timeline-time">${logTime(l.timestamp)}</div>
      </div>
    </div>`).join('')}</div>`;
}

/* ---------- ADMIN ---------- */
function renderAdminDashboard(){
  const total = ROOMS.length;
  const occupiedRooms = ROOMS.filter(r => r.status === 'occupied');
  const occupied = occupiedRooms.length;
  const vacant = ROOMS.filter(r => r.status === 'vacant').length;
  const pct = total === 0 ? 0 : Math.round((occupied / total) * 100);
  const teacherName = id => (SERVER_USERS.find(u => String(u.id) === String(id)) || {}).name || 'Teacher';
  const recentLogs = ACTIVITY_LOGS.slice(0, 5);

  return `
    ${welcomeBanner(`${greetingNow()}, ${CURRENT_USER.name}`, `${todayLabel()} · Here's what's happening on campus.`, 'building')}

    <div class="stat-grid">
      ${statCard({color:'orange', ic:'users', label:'Pending Approvals', value:PENDING_TEACHERS.length, go:"goTab('approvals')", valueStyle:'color:var(--pending);'})}
      ${statCard({color:'green', ic:'check', label:'Available Now', value:vacant, go:'goToVacantRooms()', valueStyle:'color:var(--vacant);'})}
      ${statCard({color:'red', ic:'users', label:'Occupied Now', value:occupied, go:"goTab('rooms')", valueStyle:'color:var(--occupied);'})}
    </div>

    <div class="dash-grid">
      <div class="dash-col">
        <div class="card">
          <div class="card-head">
            <h3>Campus Occupancy</h3>
            <span class="status-pill vacant"><span class="dot"></span>Live Data</span>
          </div>
          <div class="donut-wrap">
            <div class="donut" style="background: conic-gradient(var(--occupied) 0% ${pct}%, var(--vacant) ${pct}% 100%);">
              <div class="donut-inner"><strong>${pct}%</strong><span>Occupied</span></div>
            </div>
            <div class="legend">
              <div class="legend-item"><div class="legend-dot" style="background:var(--occupied);"></div> Occupied Rooms (${occupied})</div>
              <div class="legend-item"><div class="legend-dot" style="background:var(--vacant);"></div> Available Rooms (${vacant})</div>
              <div class="hint">${total} room${total === 1 ? '' : 's'} in total</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <h3>Live Room Status</h3>
            <button class="btn-sm" onclick="goTab('rooms')">View All</button>
          </div>
          ${occupiedRooms.length === 0 ? `<p style="color:var(--ink-soft); text-align:center; padding:20px;">No rooms are currently occupied.</p>` : occupiedRooms.map(r => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:14px; border:1px solid var(--border); border-radius:10px; margin-bottom:10px;">
              <div style="display:flex; align-items:center; gap:16px;">
                <div class="stat-icon blue" style="width:40px; height:40px; border-radius:8px;">${icon('rooms')}</div>
                <div>
                  <h4 style="font-size:15px; margin-bottom:4px;">${r.name}</h4>
                  <p style="font-size:12px; color:var(--ink-soft);">${[r.building, r.floor].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
              <div style="text-align:right;">
                <div class="status-pill occupied" style="margin-bottom:6px;"><span class="dot"></span>In Use</div>
                <div style="font-size:12px; font-weight:700;">By ${teacherName(r.teacher_id)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="dash-col">
        <div class="card">
          <div class="card-head">
            <h3>Recent Activity</h3>
            <button class="btn-sm" onclick="goTab('reports')">View all</button>
          </div>
          ${activityTimeline(recentLogs, 'No recent activity.')}
        </div>
      </div>
    </div>
  `;
}

/* ---------- TEACHER ---------- */
function renderTeacherDashboard(){
  const now = manilaNow();
  const myId = String(CURRENT_USER.id);
  const mine = myOccupiedRoom();

  const upcoming = RESERVATIONS
    .filter(r => String(r.teacher_id) === myId && r.status === 'approved' && r.end_time > now.full)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const todayLeft = upcoming.filter(r => r.start_time.slice(0,10) === now.date).length;
  const pendingFollowers = FOLLOWS.filter(f => String(f.teacher_id) === myId && f.status === 'pending').length;
  const vacantRooms = ROOMS.filter(r => r.status !== 'occupied' && !isRoomFixedScheduledNow(r.id));

  const subtitle = todayLeft === 0
    ? 'No reservations left today.'
    : `You have ${todayLeft} reservation${todayLeft === 1 ? '' : 's'} left today.`;

  return `
    ${welcomeBanner(`${greetingNow()}, ${CURRENT_USER.name}`, subtitle, 'calendar')}

    <div class="stat-grid">
      ${statCard({color:'red', ic:'door', label:'Current Status', value: mine ? mine.name : 'Not checked in', go:"goTab('scan')", valueStyle:'font-size:16px; line-height:1.25;'})}
      ${statCard({color:'blue', ic:'calendar', label:'Reservations Today', value:todayLeft, go:"goTab('reservations')"})}
      ${statCard({color:'orange', ic:'users', label:'Follower Requests', value:pendingFollowers, go:"goTab('followers')", valueStyle:'color:var(--pending);'})}
      ${statCard({color:'green', ic:'rooms', label:'Vacant Rooms', value:vacantRooms.length, go:'goToVacantRooms()', valueStyle:'color:var(--vacant);'})}
    </div>

    <div class="dash-grid">
      <div class="dash-col">
        ${mine ? `
        <div class="card" style="border-left:4px solid var(--occupied);">
          <div class="row-between">
            <div>
              <h3 style="font-size:20px; color:var(--ink); margin-bottom:4px;">Currently in ${mine.name}</h3>
              <p style="color:var(--ink-soft); font-size:14px;">${[mine.building, mine.floor].filter(Boolean).join(' · ')}</p>
            </div>
            <button class="btn-sm danger" onclick="goTab('scan')">Scan to Checkout</button>
          </div>
        </div>` : `
        <div class="card" style="border-left:4px solid var(--vacant);">
          <div class="row-between">
            <div>
              <h3 style="font-size:20px; color:var(--ink); margin-bottom:4px;">Not Checked In</h3>
              <p style="color:var(--ink-soft); font-size:14px;">You are not currently in a room.</p>
            </div>
            <button class="btn-sm primary" onclick="goTab('scan')">Scan to Check In</button>
          </div>
        </div>`}

        <div class="card">
          <div class="card-head">
            <h3>Upcoming Reservations</h3>
            <button class="btn-sm" onclick="goTab('reservations')">View all</button>
          </div>
          ${upcoming.length === 0 ? `<p style="color:var(--ink-soft); text-align:center; padding:20px;">No upcoming reservations.</p>` : upcoming.slice(0, 4).map(r => {
            const [tm, ap] = formatTime12(r.start_time.slice(11,16)).split(' ');
            return `
            <div class="agenda-item">
              <div class="agenda-time"><strong>${tm}</strong><span>${ap}</span></div>
              <div class="agenda-details">
                <h4>${r.room_name}</h4>
                <p>${dayLabel(r.start_time.slice(0,10))} · until ${formatTime12(r.end_time.slice(11,16))}</p>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="dash-col">
        <div class="card">
          <div class="card-head">
            <h3>Vacant Rooms</h3>
            <button class="btn-sm primary" onclick="goTab('reservations')">Reserve a room</button>
          </div>
          ${vacantRooms.length === 0 ? `<p style="color:var(--ink-soft); text-align:center; padding:20px;">No vacant rooms right now.</p>` : vacantRooms.slice(0, 5).map(r => `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; padding:12px 14px; border:1px solid var(--border); border-radius:10px; margin-bottom:10px;">
              <div>
                <h4 style="font-size:14px; margin-bottom:3px;">${r.name}</h4>
                <p style="font-size:12px; color:var(--ink-soft);">${[r.building, r.floor].filter(Boolean).join(' · ')}</p>
              </div>
              <span class="status-pill vacant"><span class="dot"></span>Vacant</span>
            </div>
          `).join('')}
          ${vacantRooms.length > 5 ? `<p class="hint">+${vacantRooms.length - 5} more</p>` : ''}
        </div>
      </div>
    </div>
  `;
}

/* ---------- STUDENT ---------- */
function renderStudentDashboard(){
  const myId = String(CURRENT_USER.id);
  const myFollows = FOLLOWS.filter(f => String(f.student_id) === myId);
  const accepted = myFollows.filter(f => f.status === 'accepted');
  const pending = myFollows.filter(f => f.status === 'pending');
  const roomOf = f => ROOMS.find(r => String(r.teacher_id) === String(f.teacher_id) && r.status === 'occupied');
  const activeCount = accepted.filter(roomOf).length;
  const sorted = [...accepted].sort((a, b) => (roomOf(b) ? 1 : 0) - (roomOf(a) ? 1 : 0));

  const subtitle = accepted.length === 0
    ? 'Follow a teacher to see where they are in real time.'
    : `${activeCount} of ${accepted.length} followed teacher${accepted.length === 1 ? '' : 's'} ${activeCount === 1 ? 'is' : 'are'} in class right now.`;

  const followedIds = accepted.map(f => String(f.teacher_id));
  const feed = ACTIVITY_LOGS.filter(l => followedIds.includes(String(l.teacher_id))).slice(0, 5);

  return `
    ${welcomeBanner(`Hello, ${CURRENT_USER.name}`, subtitle, 'users')}

    <div class="stat-grid">
      ${statCard({color:'green', ic:'users', label:'Teachers Followed', value:accepted.length, go:"goTab('follows')"})}
      ${statCard({color:'blue', ic:'door', label:'In Class Now', value:activeCount, go:"goTab('follows')"})}
    </div>

    <div class="dash-grid">
      <div class="dash-col">
        <div class="card">
          <div class="card-head">
            <h3>Live Teacher Status</h3>
            <button class="btn-sm primary" onclick="goTab('search')">Find Teachers</button>
          </div>

          ${accepted.length === 0 ? `<div class="empty">You aren't following any teachers yet.</div>` : sorted.map(f => {
            const room = roomOf(f);
            const teacher = SERVER_USERS.find(u => String(u.id) === String(f.teacher_id)) || { name: f.teacher_name };
            return `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding:14px; border:1px solid var(--border); border-radius:10px; margin-bottom:10px;">
              <div style="display:flex; align-items:center; gap:16px; min-width:0;">
                ${avatarBig(teacher, 48)}
                <div style="min-width:0;">
                  <h4 style="font-size:16px; margin-bottom:4px;">${f.teacher_name}</h4>
                  ${room
                    ? `<p style="font-size:13px; color:var(--forest); font-weight:700;">Currently in ${room.name} · ${[room.building, room.floor].filter(Boolean).join(' · ')}</p>`
                    : `<p style="font-size:13px; color:var(--ink-soft); font-weight:700;">Not in a room right now</p>`}
                </div>
              </div>
              <span class="status-pill ${room ? 'occupied' : 'vacant'}"><span class="dot"></span>${room ? 'In Class' : 'Vacant'}</span>
            </div>`;
          }).join('')}

          ${pending.length > 0 ? `
            <div style="margin-top:20px; border-top:1px solid var(--border); padding-top:20px;">
              <h4 style="font-size:14px; color:var(--ink-soft); margin-bottom:12px;">Pending Requests</h4>
              ${pending.map(f => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:#fafbfc; border-radius:12px; margin-bottom:8px;">
                  <div style="font-weight:700; font-size:14px;">${f.teacher_name}</div>
                  <span class="status-pill" style="background:#fff; border:1px solid var(--border); color:var(--ink-soft);">Waiting for approval</span>
                </div>
              `).join('')}
            </div>` : ''}
        </div>
      </div>

      <div class="dash-col">
        <div class="card">
          <div class="card-head"><h3>Teacher Activity Feed</h3></div>
          ${activityTimeline(feed, 'No recent activity from your teachers.')}
        </div>
      </div>
    </div>
  `;
}
function isReturningUser(){
  try{ return localStorage.getItem('crs-returning') === '1'; }catch(e){ return false; }
}
function markReturningUser(){
  try{ localStorage.setItem('crs-returning', '1'); }catch(e){}
}
// Any successful sign-in (or restored session) ends up calling persistWorkspace()
const _persistWorkspace = persistWorkspace;
persistWorkspace = function(){
  if(CURRENT_USER) markReturningUser();
  return _persistWorkspace.apply(this, arguments);
};
const _renderLogin = renderLogin;
renderLogin = function(){
  const html = _renderLogin();
  if(typeof AUTH_MODE !== 'undefined' && AUTH_MODE !== 'login') return html;
  return html.replace(/(<div class="plate-title">)[^<]*(<\/div>)/, '$1' + (isReturningUser() ? 'Welcome back' : 'Welcome') + '$2');
};