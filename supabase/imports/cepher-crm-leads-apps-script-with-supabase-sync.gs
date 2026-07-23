// ============================================================================
// Cepher CRM Leads — Apps Script Web App
//
// This is your existing script with one addition: every time a lead is
// added or updated (the `add` action, `doPost` from your website form, and
// the `update` action), it now ALSO upserts the same lead into Supabase via
// pushRowToSupabase(). Nothing about the existing Sheet/Calendly behavior
// changes — the additions are wrapped in try/catch so a Supabase hiccup can
// never break the Sheet write.
//
// Everything below marked "SUPABASE SYNC —" is new; everything else is
// your original code, unchanged.
// ============================================================================

var SECRET = 'REPLACE_WITH_YOUR_EXISTING_SCRIPT_SECRET'; // whatever this already is in your live script
var CALENDLY_TOKEN = 'REPLACE_WITH_YOUR_EXISTING_CALENDLY_TOKEN'; // whatever this already is in your live script

// SUPABASE SYNC — new constants. The service role key bypasses row security,
// which is required here since Apps Script isn't an authenticated ShaneOS
// user the way the browser app is. Keep this script's sharing settings
// private — anyone who can view/edit this project can see this key.
var SUPABASE_URL = 'https://cfcrilvpwqxinqraphae.supabase.co';
var SUPABASE_SERVICE_KEY = 'REPLACE_WITH_SUPABASE_SERVICE_ROLE_KEY'; // Project Settings -> API Keys -> service_role
var SHANE_USER_ID = 'REPLACE_WITH_SHANE_AUTH_USER_ID'; // select id from auth.users where email = '...'

var HEADERS = ['Date','Name','Phone','Email','State','Calculator','Coverage Gap','Annual Income','Existing Coverage','Notes','Status','Source','Appointment','Policy Type','Carrier','Coverage Amount','Policy Date','Premium','Payment Frequency','Classification','Temperature','Last Interaction','Last Interaction Date','Next Action','Next Action Owner','Next Action Due','Platform','Lead Source Type','Content Campaign','Content Publish Date','CTA Keyword','First Contact Date','Inbound Outbound','Referral Source','Reachout Cause','Conversion Behavior','Exact Statement','Lead ID','Questionnaire Status','Questionnaire Sent Date','Questionnaire Completed Date','Discovery Prep Status','Briefing Status','Briefing Completed Date','Discovery Date','Discovery Outcome','Discovery Notes','Discovery Completed Date','Briefing Told Shane','Briefing Family Situation','Briefing Current Coverage','Briefing Primary Concern','Briefing Emotional Drivers','Briefing Open Questions','Briefing Do Not Assume','Briefing Custom Opening','Briefing Five Questions','Briefing Objections','Briefing Desired Outcome','Rec Research Status','Rec Meeting Needed','Rec Meeting Booked','Rec Meeting Date','Rec Prep Status','Rec Visual Prepared','Rec Meeting Completed','Rec Meeting Outcome','Decision Status','Rec Follow-Up Required','Rec Follow-Up Due','Rec Notes','Proceed Date','Application Status','App Started Date','App Submitted Date','Product Category','UW Welcome Sent','Requirements Explained','Requirements Status','Medical Exam Required','Medical Exam Status','Add Reqs Needed','Add Reqs Description','Last Carrier Status','Last Carrier Status Date','Last Client Update','Next Update Due','Underwriting Status','Carrier Decision','Carrier Decision Date','Approval Explained','App Notes','Policy Status','Policy Issued Date','Delivery Meeting Needed','Delivery Meeting Booked','Delivery Meeting Date','Policy Delivered','Policy Delivery Date','Client Questions Resolved','FC Invite Appropriate','Policy Notes','Missed Appt Date','Recovery Status','Recovery Attempts','Recovery Attempt 1 Date','Recovery Attempt 2 Date','Recovery Attempt 3 Date','Last Recovery Attempt','Last Response','Recovery Rescheduled','Recovery New Appt Date','Moved to Nurture','Recovery Lost','Recovery Notes','FC Status','FC Offered Date','FC Accepted Date','FC Declined Date','FC Blueprint Status','FC Blueprint Completed Date','FC Conversation Offered','FC Conversation Offered Date','FC Conversation Booked','FC Conversation Date','FC Conversation Completed','FC Participants','FC Coordination Needed','FC Coordination Type','FC Notes','Relationships','AR Needed','AR Last Date','AR Next Date','AR Scheduled','AR Appt Date','AR Completed','AR Outcome','AR Household Changes','AR Protection Review Needed','AR Referral Opportunity','AR FC Follow-Up Needed','AR Notes','Revenue Amount','Revenue Date'];

var APPT_HEADERS = ['Appt ID','Lead ID','Lead Name','Lead Email','Date Booked','Appointment Date','Start Time','End Time','Time Zone','Type','Status','Confirmation Text Sent','Confirmation Email Sent','Questionnaire Sent','Questionnaire Completed','24h Reminder Sent','Prospect Confirmed','Day-Of Reminder Sent','Attended','No-Show','Rescheduled','Cancelled','Cancellation Reason','Rescheduled Date','Appointment Notes'];

var APPT_FIELDS = {'Lead ID':'leadId','Lead Name':'leadName','Lead Email':'leadEmail','Date Booked':'dateBooked','Appointment Date':'apptDate','Start Time':'startTime','End Time':'endTime','Time Zone':'timeZone','Type':'type','Status':'apptStatus','Confirmation Text Sent':'confText','Confirmation Email Sent':'confEmail','Questionnaire Sent':'qSent','Questionnaire Completed':'qDone','24h Reminder Sent':'rem24','Prospect Confirmed':'confirmed','Day-Of Reminder Sent':'remDay','Attended':'attended','No-Show':'noShow','Rescheduled':'rescheduled','Cancelled':'cancelled','Cancellation Reason':'cancelReason','Rescheduled Date':'reschedDate','Appointment Notes':'apptNotes'};

function out(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function dec(v){ return v ? decodeURIComponent(v) : ''; }

function leadSheet(){ return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; }

function apptSheet(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Appointments');
  if (!sh) sh = ss.insertSheet('Appointments');
  if (sh.getLastRow() === 0){ sh.appendRow(APPT_HEADERS); return sh; }
  var ex = sh.getRange(1,1,1,Math.max(sh.getLastColumn(),1)).getValues()[0].map(String);
  var added = false;
  APPT_HEADERS.forEach(function(h){ if (ex.indexOf(h) === -1){ ex.push(h); added = true; } });
  if (added) sh.getRange(1,1,1,ex.length).setValues([ex]);
  return sh;
}

function ensureHeaders(sheet){
  if (sheet.getLastRow() === 0){ sheet.appendRow(HEADERS); return HEADERS; }
  var existing = sheet.getRange(1,1,1,Math.max(sheet.getLastColumn(),1)).getValues()[0].map(String);
  var added = false;
  HEADERS.forEach(function(h){
    if (existing.indexOf(h) === -1){ existing.push(h); added = true; }
  });
  if (added) sheet.getRange(1,1,1,existing.length).setValues([existing]);
  return existing;
}

function rowFromMap(headers, map){
  return headers.map(function(h){ return map.hasOwnProperty(h) ? map[h] : ''; });
}

// SUPABASE SYNC — maps your free-text Status column to ShaneOS's pipeline
// stage. Extend this if you introduce new Status values later.
function mapStatusToStage(status){
  var s = String(status || '').toLowerCase();
  if (s.indexOf('appointment booked') !== -1) return 'Appointment Scheduled';
  if (s.indexOf('appointment confirmed') !== -1) return 'Appointment Confirmed';
  if (s.indexOf('appointment offered') !== -1) return 'Appointment Offered';
  if (s.indexOf('qualified') !== -1) return 'Qualified';
  return 'New Lead';
}

// SUPABASE SYNC — reads the current values of one lead row and upserts them
// into pipeline_records, keyed on Lead ID so repeated calls update the same
// record instead of duplicating it. Wrapped so it can never break the
// existing Sheet-writing flow.
function pushRowToSupabase(sheet, headers, rowIndex){
  try {
    var row = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
    var get = function (col) {
      var i = headers.indexOf(col);
      return i >= 0 ? row[i] : '';
    };
    var leadId = get('Lead ID');
    if (!leadId) return;

    var payload = {
      owner_user_id: SHANE_USER_ID,
      external_id: String(leadId),
      name: String(get('Name') || ''),
      stage: mapStatusToStage(get('Status')),
      lead_source: String(get('Platform') || get('Source') || '') || null,
      phone: String(get('Phone') || '') || null,
      email: String(get('Email') || '') || null,
      notes: String(get('Notes') || '') || null,
      owner: 'Shane',
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    UrlFetchApp.fetch(
      SUPABASE_URL + '/rest/v1/pipeline_records?on_conflict=owner_user_id,external_id',
      options,
    );
  } catch (err) {
    Logger.log('Supabase sync failed: ' + err.message);
  }
}

function doPost(e){
  try{
    if (e.parameter && e.parameter.secret) return doGet(e);
    var data = JSON.parse(e.postData.contents);
    var sheet = leadSheet();
    var headers = ensureHeaders(sheet);
    sheet.appendRow(rowFromMap(headers, {
      'Date': new Date().toLocaleString(),
      'Name': data.name || '', 'Phone': data.phone || '', 'Email': data.email || '',
      'State': data.state || '', 'Calculator': data.calculator || '',
      'Coverage Gap': data['coverage-gap'] || '', 'Annual Income': data['annual-income'] || '',
      'Existing Coverage': data['existing-coverage'] || '',
      'Notes': '', 'Status': 'New Qualified Lead', 'Source': 'Website', 'Platform': 'Website',
      'Lead ID': Utilities.getUuid() // SUPABASE SYNC — was missing before; needed as the sync key.
    }));
    pushRowToSupabase(sheet, headers, sheet.getLastRow()); // SUPABASE SYNC
    return out({result:'success'});
  }catch(err){ return out({error:err.message}); }
}

function doGet(e){
  var p = e.parameter;
  if (!p.secret || p.secret !== SECRET) return out({error:'Unauthorized'});
  var sheet = leadSheet();
  var headers = ensureHeaders(sheet);

  if (p.action === 'add'){
    sheet.appendRow(rowFromMap(headers, {
      'Date': new Date().toLocaleString(),
      'Name': dec(p.name), 'Phone': dec(p.phone), 'Email': dec(p.email),
      'State': dec(p.state), 'Notes': dec(p.notes),
      'Status': p.status ? dec(p.status) : 'New Qualified Lead', 'Source': dec(p.source),
      'Appointment': dec(p.appointment),
      'Classification': dec(p.classification), 'Temperature': dec(p.temperature),
      'Platform': dec(p.platform), 'Lead Source Type': dec(p.sourceType), 'Content Campaign': dec(p.contentCampaign),
      'Lead ID': Utilities.getUuid()
    }));
    pushRowToSupabase(sheet, headers, sheet.getLastRow()); // SUPABASE SYNC
    return out({result:'added'});
  }

  if (p.action === 'appts'){
    var ash = apptSheet();
    var ad = ash.getDataRange().getValues();
    if (ad.length <= 1) return out({appointments:[]});
    var ah = ad[0];
    var list = [];
    for (var ai = 1; ai < ad.length; ai++){
      if (!ad[ai][0]) continue;
      var ap = {_rowIndex: ai + 1};
      for (var aj = 0; aj < ah.length; aj++) ap[String(ah[aj])] = ad[ai][aj];
      list.push(ap);
    }
    return out({appointments:list});
  }

  if (p.action === 'addAppt'){
    var ash = apptSheet();
    var ah = ash.getRange(1,1,1,ash.getLastColumn()).getValues()[0].map(String);
    var amap = {'Appt ID': Utilities.getUuid()};
    for (var acol in APPT_FIELDS){
      if (p.hasOwnProperty(APPT_FIELDS[acol])) amap[acol] = dec(p[APPT_FIELDS[acol]]);
    }
    ash.appendRow(ah.map(function(h){ return amap.hasOwnProperty(h) ? amap[h] : ''; }));
    return out({result:'added'});
  }

  if (p.action === 'updateAppt'){
    var ash = apptSheet();
    var ah = ash.getRange(1,1,1,ash.getLastColumn()).getValues()[0].map(String);
    var arw = parseInt(p.row);
    for (var ucol in APPT_FIELDS){
      if (p.hasOwnProperty(APPT_FIELDS[ucol])){
        var aci = ah.indexOf(ucol) + 1;
        if (aci > 0) ash.getRange(arw, aci).setValue(dec(p[APPT_FIELDS[ucol]]));
      }
    }
    return out({result:'updated'});
  }

  if (p.action === 'deleteAppt'){
    var ash = apptSheet();
    var drw = parseInt(p.row);
    if (drw > 1 && drw <= ash.getLastRow()) ash.deleteRow(drw);
    return out({result:'deleted'});
  }

  if (p.action === 'update'){
    var rowIndex = parseInt(p.row);
    var fields = {'Name':'name','Phone':'phone','Email':'email','State':'state','Status':'status','Notes':'notes','Source':'source','Appointment':'appointment','Policy Type':'policyType','Carrier':'carrier','Coverage Amount':'coverageAmount','Policy Date':'policyDate','Premium':'premium','Payment Frequency':'frequency','Classification':'classification','Temperature':'temperature','Last Interaction':'lastInteraction','Last Interaction Date':'lastInteractionDate','Next Action':'nextAction','Next Action Owner':'nextActionOwner','Next Action Due':'nextActionDue','Platform':'platform','Lead Source Type':'sourceType','Content Campaign':'contentCampaign','Content Publish Date':'contentPublishDate','CTA Keyword':'ctaKeyword','First Contact Date':'firstContactDate','Inbound Outbound':'inboundOutbound','Referral Source':'referralSource','Reachout Cause':'reachoutCause','Conversion Behavior':'conversionBehavior','Exact Statement':'exactStatement','Questionnaire Status':'qStatus','Questionnaire Sent Date':'qSentDate','Questionnaire Completed Date':'qDoneDate','Discovery Prep Status':'discPrep','Briefing Status':'briefStatus','Briefing Completed Date':'briefDoneDate','Discovery Date':'discDate','Discovery Outcome':'discOutcome','Discovery Notes':'discNotes','Discovery Completed Date':'discDoneDate','Briefing Told Shane':'bTold','Briefing Family Situation':'bFamily','Briefing Current Coverage':'bCoverage','Briefing Primary Concern':'bConcern','Briefing Emotional Drivers':'bEmotional','Briefing Open Questions':'bQuestions','Briefing Do Not Assume':'bNoAssume','Briefing Custom Opening':'bOpening','Briefing Five Questions':'bFiveQs','Briefing Objections':'bObjections','Briefing Desired Outcome':'bDesired','Rec Research Status':'recResearch','Rec Meeting Needed':'recNeeded','Rec Meeting Booked':'recBooked','Rec Meeting Date':'recDate','Rec Prep Status':'recPrep','Rec Visual Prepared':'recVisual','Rec Meeting Completed':'recDone','Rec Meeting Outcome':'recOutcome','Decision Status':'decisionStatus','Rec Follow-Up Required':'recFollowUp','Rec Follow-Up Due':'recFollowUpDue','Rec Notes':'recNotes','Proceed Date':'proceedDate','Application Status':'appStatus','App Started Date':'appStartedDate','App Submitted Date':'appSubmittedDate','Product Category':'productCategory','UW Welcome Sent':'uwWelcome','Requirements Explained':'reqExplained','Requirements Status':'reqStatus','Medical Exam Required':'medRequired','Medical Exam Status':'medStatus','Add Reqs Needed':'addReqs','Add Reqs Description':'addReqsDesc','Last Carrier Status':'lastCarrierStatus','Last Carrier Status Date':'lastCarrierStatusDate','Last Client Update':'lastClientUpdate','Next Update Due':'nextUpdateDue','Underwriting Status':'uwStatus','Carrier Decision':'carrierDecision','Carrier Decision Date':'carrierDecisionDate','Approval Explained':'approvalExplained','App Notes':'appNotes','Policy Status':'policyStatus','Policy Issued Date':'policyIssuedDate','Delivery Meeting Needed':'delivNeeded','Delivery Meeting Booked':'delivBooked','Delivery Meeting Date':'delivDate','Policy Delivered':'policyDelivered','Policy Delivery Date':'policyDeliveryDate','Client Questions Resolved':'questionsResolved','FC Invite Appropriate':'fcInvite','Policy Notes':'policyNotes','Missed Appt Date':'missedApptDate','Recovery Status':'recoveryStatus','Recovery Attempts':'recoveryAttempts','Recovery Attempt 1 Date':'recAttempt1','Recovery Attempt 2 Date':'recAttempt2','Recovery Attempt 3 Date':'recAttempt3','Last Recovery Attempt':'lastRecoveryAttempt','Last Response':'lastResponse','Recovery Rescheduled':'recoveryRescheduled','Recovery New Appt Date':'recoveryNewApptDate','Moved to Nurture':'movedToNurture','Recovery Lost':'recoveryLost','Recovery Notes':'recoveryNotes','FC Status':'fcStatus','FC Offered Date':'fcOfferedDate','FC Accepted Date':'fcAcceptedDate','FC Declined Date':'fcDeclinedDate','FC Blueprint Status':'fcBlueprintStatus','FC Blueprint Completed Date':'fcBlueprintDate','FC Conversation Offered':'fcConvOffered','FC Conversation Offered Date':'fcConvOfferedDate','FC Conversation Booked':'fcConvBooked','FC Conversation Date':'fcConvDate','FC Conversation Completed':'fcConvCompleted','FC Participants':'fcParticipants','FC Coordination Needed':'fcCoordNeeded','FC Coordination Type':'fcCoordType','FC Notes':'fcNotes','Relationships':'relationships','AR Needed':'arNeeded','AR Last Date':'arLastDate','AR Next Date':'arNextDate','AR Scheduled':'arScheduled','AR Appt Date':'arApptDate','AR Completed':'arCompleted','AR Outcome':'arOutcome','AR Household Changes':'arHousehold','AR Protection Review Needed':'arProtReview','AR Referral Opportunity':'arReferralOpp','AR FC Follow-Up Needed':'arFCFollowUp','AR Notes':'arNotes','Revenue Amount':'revenueAmount','Revenue Date':'revenueDate'};
    for (var col in fields){
      if (p.hasOwnProperty(fields[col])){
        var ci = headers.indexOf(col) + 1;
        if (ci > 0) sheet.getRange(rowIndex, ci).setValue(dec(p[fields[col]]));
      }
    }
    pushRowToSupabase(sheet, headers, rowIndex); // SUPABASE SYNC
    return out({result:'updated'});
  }

  if (p.action === 'delete'){
    var rowIndex = parseInt(p.row);
    if (rowIndex > 1 && rowIndex <= sheet.getLastRow()) sheet.deleteRow(rowIndex);
    return out({result:'deleted'});
  }

  if (p.action === 'calendly') return out(getCalendly());

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return out({leads:[]});
  var hs = data[0];
  var idCol = hs.indexOf('Lead ID');
  var leads = [];
  for (var i = 1; i < data.length; i++){
    if (!data[i][1]) continue;
    if (idCol >= 0 && !data[i][idCol]){
      var newId = Utilities.getUuid();
      sheet.getRange(i + 1, idCol + 1).setValue(newId);
      data[i][idCol] = newId;
    }
    var lead = {_rowIndex: i + 1};
    for (var j = 0; j < hs.length; j++) lead[String(hs[j])] = data[i][j];
    leads.push(lead);
  }
  return out({leads:leads});
}

function getCalendly(){
  if (!CALENDLY_TOKEN || CALENDLY_TOKEN.indexOf('PASTE') === 0) return {events:[], notice:'No Calendly token set'};
  try{
    var opts = {headers:{Authorization:'Bearer ' + CALENDLY_TOKEN}, muteHttpExceptions:true};
    var me = JSON.parse(UrlFetchApp.fetch('https://api.calendly.com/users/me', opts).getContentText());
    if (!me.resource) return {events:[], error:'Calendly token invalid or expired'};
    var url = 'https://api.calendly.com/scheduled_events?user=' + encodeURIComponent(me.resource.uri)
      + '&status=active&sort=start_time:asc&min_start_time=' + new Date(Date.now() - 86400000).toISOString() + '&count=20';
    var evs = JSON.parse(UrlFetchApp.fetch(url, opts).getContentText());
    var events = [];
    (evs.collection || []).forEach(function(ev){
      var uuid = ev.uri.split('/').pop();
      var person = {};
      try{
        var inv = JSON.parse(UrlFetchApp.fetch('https://api.calendly.com/scheduled_events/' + uuid + '/invitees', opts).getContentText());
        person = (inv.collection && inv.collection[0]) || {};
      }catch(e2){}
      events.push({event_name: ev.name, start: ev.start_time, end: ev.end_time, invitee_name: person.name || '', invitee_email: person.email || ''});
    });
    return {events:events};
  }catch(err){ return {events:[], error:err.message}; }
}
