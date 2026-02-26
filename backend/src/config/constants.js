module.exports = {
  CANDIDATE_STATUS: [
    'New', 'Walk_In_Registered', 'Contacted', 'WhatsApp_Failed',
    'Interested', 'Not_Interested', 'Screening', 'Screened',
    'Portal_Applied', 'Interview_Scheduled', 'Interview_Done',
    'Selected', 'Rejected', 'On_Hold', 'Waitlisted',
    'Offered', 'Offer_Accepted', 'Offer_Declined', 'Offer_Expired',
    'Onboarding', 'Training', 'Training_Completed', 'Training_Failed',
    'Deployed', 'Unreachable', 'Blacklisted', 'Archived'
  ],

  QUALIFICATION: [
    'ITI_Electrical', 'ITI_Other', 'Diploma_Electrical', 'Diploma_Other',
    'BTech_Electrical', 'BTech_Other', 'BSc', 'HSC', '10th', 'Other'
  ],

  SOURCE: ['Excel', 'CSV', 'GSheet', 'Manual', 'Walk_In', 'Referral'],

  PANEL_DECISION: ['Pending', 'Selected', 'Rejected', 'On_Hold'],

  TRAINING_STATUS: ['Not_Assigned', 'Assigned', 'Day1', 'Day2', 'Day3', 'Completed', 'Failed'],

  BGV_STATUS: ['Not_Started', 'In_Progress', 'Clear', 'Discrepancy', 'Red_Flag'],

  CALL_DIRECTION: ['outbound', 'inbound'],

  CALL_OUTCOME: [
    'Connected_Positive', 'Connected_Negative', 'Connected_Callback',
    'Connected_Info', 'Connected_Escalation',
    'No_Answer', 'Busy', 'Switched_Off', 'Not_Reachable',
    'Wrong_Number', 'Does_Not_Exist'
  ],

  CALL_FOLLOWUP: [
    'Schedule_Interview', 'Send_Portal_Link', 'Send_Doc_Reminder',
    'Send_Offer', 'Escalate_To_Lead', 'Callback_Scheduled', 'No_Action'
  ],

  TIMELINE_EVENT: [
    'whatsapp_in', 'whatsapp_out', 'call_outbound', 'call_inbound',
    'sms_sent', 'internal_note', 'status_change', 'document_event',
    'score_update', 'panel_decision', 'system_event'
  ],

  REJECTION_REASONS: [
    'Insufficient_Technical', 'Failed_Practical', 'Location_Mismatch',
    'Poor_Communication', 'Overqualified', 'Underqualified',
    'Timeline_Mismatch', 'Failed_BGV', 'Medical_Unfit', 'Other'
  ],

  USER_ROLES: ['super_admin', 'team_lead', 'agent', 'interviewer', 'telecaller'],

  TEAMS: ['Alpha', 'Beta', 'Gamma', 'Delta'],

  PREFERRED_LANGUAGE: ['hi', 'en'],

  PREFERRED_CONTACT: ['whatsapp', 'call', 'both'],

  WHATSAPP_STATUS: ['pending', 'sent', 'delivered', 'read', 'failed_1', 'failed_2', 'opted_out'],
};
