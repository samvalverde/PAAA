// Audit logging utility
// ======================================

import { AuditAPI } from '../services/api.js';

/**
 * Utility function to easily log audit actions throughout the app
 */
export const auditLogger = {
  
  /**
   * Log a user action with automatic error handling
   * @param {string} actionType - The action type name (Create, Update, Delete, etc.)
   * @param {string} description - Description of what happened
   * @param {number|null} schoolId - Optional school ID for context
   */
  async log(actionType, description, schoolId = null) {
    try {
      const result = await AuditAPI.logActionByName(actionType, description, schoolId);
      console.log('Audit logged successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to log audit:', error);
      // Don't throw - audit logging should not break the main flow
    }
  },

  // Convenience methods for common actions
  create: (description, schoolId = null) => auditLogger.log('Create', description, schoolId),
  update: (description, schoolId = null) => auditLogger.log('Update', description, schoolId),
  delete: (description, schoolId = null) => auditLogger.log('Delete', description, schoolId),
  read: (description, schoolId = null) => auditLogger.log('Read', description, schoolId),
  approve: (description, schoolId = null) => auditLogger.log('Approve', description, schoolId),
  reject: (description, schoolId = null) => auditLogger.log('Reject', description, schoolId),
  submit: (description, schoolId = null) => auditLogger.log('Submit', description, schoolId),
  review: (description, schoolId = null) => auditLogger.log('Review', description, schoolId),

  // ETL specific actions
  etlLoad: (dataset, program, schoolId = null) => 
    auditLogger.log('Create', `ETL load: ${dataset} data for ${program}`, schoolId),
  
  // File actions
  fileUpload: (filename, projectName, schoolId = null) => 
    auditLogger.log('Create', `File uploaded: ${filename} to project ${projectName}`, schoolId),
  
  fileDownload: (filename, projectName, schoolId = null) => 
    auditLogger.log('Read', `File downloaded: ${filename} from project ${projectName}`, schoolId),

  // Analytics actions
  analyticsRun: (analysisType, dataset, schoolId = null) => 
    auditLogger.log('Review', `Analytics executed: ${analysisType} on ${dataset}`, schoolId),

  // User management actions
  userLogin: (username) => 
    auditLogger.log('Read', `User logged in: ${username}`),
  
  userLogout: (username) => 
    auditLogger.log('Read', `User logged out: ${username}`),

  // Project actions
  projectCreate: (projectName, schoolId = null) => 
    auditLogger.log('Create', `Project created: ${projectName}`, schoolId),
  
  projectView: (projectName, schoolId = null) => 
    auditLogger.log('Read', `Project viewed: ${projectName}`, schoolId),

  projectUpdate: (projectName, schoolId = null) => 
    auditLogger.log('Update', `Project updated: ${projectName}`, schoolId),

  // Process actions
  processCreate: (processName, schoolId = null) => 
    auditLogger.log('Create', `Process created: ${processName}`, schoolId),
  
  processUpdate: (processName, schoolId = null) => 
    auditLogger.log('Update', `Process updated: ${processName}`, schoolId)
};

// Export individual functions for convenience
export const {
  create,
  update,
  delete: deleteAction,
  read,
  approve,
  reject,
  submit,
  review,
  etlLoad,
  fileUpload,
  fileDownload,
  analyticsRun,
  userLogin,
  userLogout,
  projectCreate,
  projectView,
  projectUpdate,
  processCreate,
  processUpdate
} = auditLogger;

// Default export
export default auditLogger;