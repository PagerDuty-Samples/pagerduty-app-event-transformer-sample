export function transform(PD) {
    // capture incoming webhook body
    let body = PD.inputRequest.body;
    // capture incoming webhook headers
    const headers = PD.inputRequest.headers;
    let emitEvent = true;
   
    // GitHub stuff
    let githubEventType = '';
   
    // capture the GitHub event type
    for (var i = 0; i < headers.length; i++) {
        if('X-GitHub-Event' in headers[i]) {
            githubEventType = headers[i]['X-GitHub-Event'];
        }
    }
    let githubLinkURL = '';
   
    // Incident stuff
    let incidentSummary = '';
    let dedupKey = '';
    let incidentAction = PD.Trigger;

    // only process webhook if it's an 'issues' event type
    if (githubEventType === 'issues') {
        dedupKey = `${body.issue.id}`;
        
        // if the github issue is opened set incident summary with the issue title
        if (body.action === 'reopened' || body.action === 'opened') {
            incidentSummary = `[${body.repository.full_name}] Issue:  ${body.issue.title}`;
            githubLinkURL = body.issue.html_url;
        // if neither of these actions are occurring, don't send an event    
        } else {
            emitEvent = false;
        }
    // if the github event type is something other than issues, don't send an event    
    } else {
        emitEvent = false;
    }
    
    // preparing the normalized_event to be sent to pagerduty
    let normalized_event = {
        event_action: incidentAction,
        dedup_key: dedupKey,
        payload: {
            summary: incidentSummary,
            source: 'GitHub',
            severity: PD.Critical,
            custom_details: `${body.issue.body} (${body.issue.user.login})`
        },
   
        links: [{
            "href": githubLinkURL,
            "text": "View In GitHub"
        }],
    }

    if (emitEvent) PD.emitEventsV2([normalized_event])
  }