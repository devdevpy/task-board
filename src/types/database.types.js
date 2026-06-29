/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} title
 * @property {string|null} description
 * @property {string} owner_id
 * @property {string} created_at
 */

/**
 * @typedef {Object} Stage
 * @property {string} id
 * @property {string} project_id
 * @property {string} name
 * @property {number} position
 * @property {string} created_at
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} project_id
 * @property {string|null} stage_id
 * @property {string} title
 * @property {string|null} description
 * @property {number} position
 * @property {boolean} done
 * @property {string} created_at
 */
