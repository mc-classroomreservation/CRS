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
function welcomeBanner({eyebrow, title, subtitle, ic, primary, secondary}){
  return `
    <div class="welcome-banner hero">
      <div class="hero-text">
        <div class="hero-eyebrow">${eyebrow}</div>
        <h2>${title}</h2>
        <p>${subtitle}</p>
        ${primary || secondary ? `<div class="hero-actions">
          ${primary ? `<button class="hero-btn" onclick="${primary.go}">${primary.label}</button>` : ''}
          ${secondary ? `<button class="hero-link" onclick="${secondary.go}">${secondary.label}</button>` : ''}
        </div>` : ''}
      </div>
      <div class="hero-icon" style="color:#fff;">${icon(ic)}</div>
    </div>`;
}
function statCard({color, ic, label, value, sub='', go, valueStyle=''}){
  return `
    <div class="stat-card c-${color}"${go ? ` style="cursor:pointer;" onclick="${go}"` : ''}>
      <div class="stat-icon ${color}">${icon(ic)}</div>
      <div class="stat-content">
        <div class="value" style="${valueStyle}">${value}</div>
        <div class="label">${label}</div>
        ${sub ? `<div class="sub">${sub}</div>` : ''}
      </div>
    </div>`;
}
function cardHead(title, sub, right=''){
  return `<div class="card-head"><h3>${title}</h3>${right}</div>${sub ? `<p class="card-sub">${sub}</p>` : ''}`;
}
function cardLink(label, go){
  return `<button class="card-link" onclick="${go}">${label}</button>`;
}
function itemBox({title, sub='', lead='', right='', go=''}){
  return `
    <div class="item-box"${go ? ` style="cursor:pointer;" onclick="${go}"` : ''}>
      ${lead ? `<div class="item-lead">${lead}</div>` : ''}
      <div class="item-main"><div class="item-title">${title}</div>${sub ? `<div class="item-sub">${sub}</div>` : ''}</div>
      ${right}
    </div>`;
}
function arrowBtn(){ return `<span class="item-arrow">${icon('arrowRight')}</span>`; }
function pill(kind, text){ return `<span class="status-pill ${kind}"><span class="dot"></span>${text}</span>`; }
function emptyNote(text){ return `<p style="color:var(--ink-soft); text-align:center; padding:20px 10px;">${text}</p>`; }
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
  const pending = PENDING_TEACHERS.length;

  return `
    ${welcomeBanner({
      eyebrow: todayLabel().toUpperCase(),
      title: `${greetingNow()}, ${CURRENT_USER.name}.`,
      subtitle: `Here's what's happening on campus right now.`,
      ic: 'building',
      primary: { label: pending > 0 ? 'Review approvals' : 'Manage rooms', go: pending > 0 ? "goTab('approvals')" : "goTab('rooms')" },
      secondary: { label: 'View reports', go: "goTab('reports')" }
    })}

    <div class="stat-grid">
      ${statCard({color:'orange', ic:'users', label:'Pending approvals', value:pending, sub: pending === 0 ? 'Nothing to review' : 'Teacher sign-ups to review', go:"goTab('approvals')"})}
      ${statCard({color:'green', ic:'check', label:'Available now', value:vacant, sub:`of ${total} room${total === 1 ? '' : 's'}`, go:'goToVacantRooms()'})}
      ${statCard({color:'red', ic:'users', label:'Occupied now', value:occupied, sub: occupied === 0 ? 'All rooms are free' : 'Rooms in use', go:"goTab('rooms')"})}
    </div>

    <div class="dash-grid">
      <div class="dash-col">
        <div class="card">
          ${cardHead('Campus occupancy', 'Live room usage across campus.', pill('vacant', 'Live data'))}
          <div class="donut-wrap">
            <div class="donut" style="background: conic-gradient(var(--occupied) 0% ${pct}%, var(--vacant) ${pct}% 100%);">
              <div class="donut-inner"><strong>${pct}%</strong><span>Occupied</span></div>
            </div>
            <div class="legend">
              <div class="legend-item"><div class="legend-dot" style="background:var(--occupied);"></div> Occupied rooms (${occupied})</div>
              <div class="legend-item"><div class="legend-dot" style="background:var(--vacant);"></div> Available rooms (${vacant})</div>
            </div>
          </div>
        </div>

        <div class="card">
          ${cardHead('Live room status', 'Rooms being used right now.', cardLink('View all', "goTab('rooms')"))}
          ${occupiedRooms.length === 0 ? emptyNote('No rooms are currently occupied.') : occupiedRooms.map(r => itemBox({
            title: r.name,
            sub: `${[r.building, r.floor].filter(Boolean).join(' · ')} · by ${teacherName(r.teacher_id)}`,
            right: pill('occupied', 'In use'),
            go: "goTab('rooms')"
          })).join('')}
        </div>
      </div>

      <div class="dash-col">
        <div class="card">
          ${cardHead('Recent activity', 'Latest check-ins and check-outs.', cardLink('View all', "goTab('reports')"))}
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
    ${welcomeBanner({
      eyebrow: todayLabel().toUpperCase(),
      title: `${greetingNow()}, ${CURRENT_USER.name}.`,
      subtitle,
      ic: 'calendar',
      primary: { label: mine ? 'Scan to check out' : 'Scan to check in', go: "goTab('scan')" },
      secondary: { label: 'Reserve a room', go: "goTab('reservations')" }
    })}

    <div class="stat-grid">
      ${statCard({color:'red', ic:'door', label:'Current status', value: mine ? mine.name : 'Not checked in', sub: mine ? [mine.building, mine.floor].filter(Boolean).join(' · ') : 'Scan a room QR to check in', go:"goTab('scan')", valueStyle:'font-size:24px; line-height:1.15;'})}
      ${statCard({color:'blue', ic:'calendar', label:'Reservations today', value:todayLeft, sub:`${upcoming.length} upcoming in total`, go:"goTab('reservations')"})}
      ${statCard({color:'orange', ic:'users', label:'Follower requests', value:pendingFollowers, sub: pendingFollowers === 0 ? 'No requests' : 'Waiting for your reply', go:"goTab('followers')"})}
      ${statCard({color:'green', ic:'rooms', label:'Vacant rooms', value:vacantRooms.length, sub:'Free right now', go:'goToVacantRooms()'})}
    </div>

    <div class="dash-grid">
      <div class="dash-col">
        <div class="card">
          ${cardHead('Upcoming reservations', 'Your next booked classes.', cardLink('View all', "goTab('reservations')"))}
          ${upcoming.length === 0 ? emptyNote('No upcoming reservations.') : upcoming.slice(0, 4).map(r => itemBox({
            title: r.room_name,
            sub: `${dayLabel(r.start_time.slice(0,10))} · ${formatTime12(r.start_time.slice(11,16))} – ${formatTime12(r.end_time.slice(11,16))}`,
            right: arrowBtn(),
            go: "goTab('reservations')"
          })).join('')}
        </div>
      </div>

      <div class="dash-col">
        <div class="card">
          ${cardHead('Vacant rooms', 'Rooms you can use right now.', cardLink('Reserve a room', "goTab('reservations')"))}
          ${vacantRooms.length === 0 ? emptyNote('No vacant rooms right now.') : vacantRooms.slice(0, 5).map(r => itemBox({
            title: r.name,
            sub: [r.building, r.floor].filter(Boolean).join(' · '),
            right: pill('vacant', 'Vacant'),
            go: "goTab('reservations')"
          })).join('')}
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
    ${welcomeBanner({
      eyebrow: todayLabel().toUpperCase(),
      title: `Hello, ${CURRENT_USER.name}.`,
      subtitle,
      ic: 'users',
      primary: { label: 'Find teachers', go: "goTab('search')" },
      secondary: { label: 'My follows', go: "goTab('follows')" }
    })}

    <div class="stat-grid">
      ${statCard({color:'green', ic:'users', label:'Teachers followed', value:accepted.length, sub:`${pending.length} request${pending.length === 1 ? '' : 's'} pending`, go:"goTab('follows')"})}
      ${statCard({color:'blue', ic:'door', label:'In class now', value:activeCount, sub:`of ${accepted.length} followed`, go:"goTab('follows')"})}
    </div>

    <div class="dash-grid">
      <div class="dash-col">
        <div class="card">
          ${cardHead('Live teacher status', 'Where your teachers are right now.', cardLink('Find teachers', "goTab('search')"))}
          ${accepted.length === 0 ? `<div class="empty">You aren't following any teachers yet.</div>` : sorted.map(f => {
            const room = roomOf(f);
            const teacher = SERVER_USERS.find(u => String(u.id) === String(f.teacher_id)) || { name: f.teacher_name };
            return itemBox({
              title: f.teacher_name,
              sub: room ? `In ${room.name} · ${[room.building, room.floor].filter(Boolean).join(' · ')}` : 'Not in a room right now',
              lead: avatarBig(teacher, 46),
              right: pill(room ? 'occupied' : 'vacant', room ? 'In class' : 'Vacant')
            });
          }).join('')}

          ${pending.length > 0 ? `
            <div style="margin-top:22px; padding-top:20px; border-top:1px solid var(--border);">
              <h4 style="font-size:14px; color:var(--ink-soft); margin-bottom:12px;">Pending requests</h4>
              ${pending.map(f => itemBox({
                title: f.teacher_name,
                right: `<span class="status-pill" style="background:#fff; border:1px solid var(--border); color:var(--ink-soft);">Waiting for approval</span>`
              })).join('')}
            </div>` : ''}
        </div>
      </div>

      <div class="dash-col">
        <div class="card">
          ${cardHead('Teacher activity', 'Latest check-ins from teachers you follow.')}
          ${activityTimeline(feed, 'No recent activity from your teachers.')}
        </div>
      </div>
    </div>
  `;
}
