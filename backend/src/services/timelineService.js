const Timeline = require('../models/Timeline');

class TimelineService {
  static async addEvent(candidateId, eventType, data, userId = null) {
    const event = new Timeline({
      candidate: candidateId,
      eventType,
      channel: data.channel || 'system',
      direction: data.direction || null,
      content: data.content || '',
      metadata: data.metadata || {},
      callDuration: data.callDuration,
      callRecordingUrl: data.callRecordingUrl,
      callOutcome: data.callOutcome,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus,
      documentType: data.documentType,
      documentAction: data.documentAction,
      scoreType: data.scoreType,
      oldValue: data.oldValue,
      newValue: data.newValue,
      createdBy: userId,
      createdByName: data.createdByName || 'System',
      isSystem: !userId,
    });
    return event.save();
  }

  static async whatsappOut(candidateId, content, userId, userName) {
    return this.addEvent(candidateId, 'whatsapp_out', {
      channel: 'whatsapp', direction: 'out', content, createdByName: userName
    }, userId);
  }

  static async whatsappIn(candidateId, content) {
    return this.addEvent(candidateId, 'whatsapp_in', {
      channel: 'whatsapp', direction: 'in', content
    });
  }

  static async callOutbound(candidateId, data, userId, userName) {
    return this.addEvent(candidateId, 'call_outbound', {
      channel: 'call', direction: 'out',
      content: data.summary || '',
      callDuration: data.durationSeconds,
      callRecordingUrl: data.recordingUrl,
      callOutcome: data.outcome,
      createdByName: userName,
    }, userId);
  }

  static async callInbound(candidateId, data, userId, userName) {
    return this.addEvent(candidateId, 'call_inbound', {
      channel: 'call', direction: 'in',
      content: data.summary || '',
      callDuration: data.durationSeconds,
      callRecordingUrl: data.recordingUrl,
      callOutcome: data.outcome,
      createdByName: userName,
    }, userId);
  }

  static async statusChange(candidateId, oldStatus, newStatus, userId, userName, reason = '') {
    return this.addEvent(candidateId, 'status_change', {
      channel: 'system', oldStatus, newStatus, content: reason, createdByName: userName
    }, userId);
  }

  static async panelDecision(candidateId, decision, comments, userId, userName) {
    return this.addEvent(candidateId, 'panel_decision', {
      channel: 'system', content: `${decision}: ${comments}`, createdByName: userName,
      metadata: { decision }
    }, userId);
  }

  static async note(candidateId, content, userId, userName) {
    return this.addEvent(candidateId, 'internal_note', {
      channel: 'manual', content, createdByName: userName
    }, userId);
  }

  static async documentEvent(candidateId, docType, action, userId, userName) {
    return this.addEvent(candidateId, 'document_event', {
      channel: 'system', documentType: docType, documentAction: action,
      content: `${docType}: ${action}`, createdByName: userName
    }, userId);
  }

  static async scoreUpdate(candidateId, scoreType, oldVal, newVal, userId, userName) {
    return this.addEvent(candidateId, 'score_update', {
      channel: 'system', scoreType, oldValue: oldVal, newValue: newVal,
      content: `${scoreType}: ${oldVal} → ${newVal}`, createdByName: userName
    }, userId);
  }

  static async getTimeline(candidateId, { eventType, limit = 50, skip = 0 } = {}) {
    const query = { candidate: candidateId };
    if (eventType) query.eventType = eventType;
    return Timeline.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name role');
  }
}

module.exports = TimelineService;
