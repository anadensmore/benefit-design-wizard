const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'benefit_configurations.db');
        this.db = null;
        this.init();
    }

    init() {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.createTables();
            }
        });
    }

    createTables() {
        const createConfigurationsTable = `
            CREATE TABLE IF NOT EXISTS benefit_configurations (
                id TEXT PRIMARY KEY,
                client_name TEXT NOT NULL,
                configuration_data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `;

        const createPopulationsTable = `
            CREATE TABLE IF NOT EXISTS populations (
                id TEXT PRIMARY KEY,
                configuration_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                claim_submission_window INTEGER,
                runout_period INTEGER,
                launch_date TEXT,
                end_date TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (configuration_id) REFERENCES benefit_configurations (id) ON DELETE CASCADE
            )
        `;

        const createCategoriesTable = `
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                population_id TEXT NOT NULL,
                name TEXT NOT NULL,
                format TEXT NOT NULL,
                structure TEXT NOT NULL,
                start_date TEXT,
                end_date TEXT,
                amount_data TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (population_id) REFERENCES populations (id) ON DELETE CASCADE
            )
        `;

        const createExpenseTypesTable = `
            CREATE TABLE IF NOT EXISTS expense_types (
                id TEXT PRIMARY KEY,
                category_id TEXT NOT NULL,
                expense_category TEXT NOT NULL,
                historical_spend TEXT,
                reimbursement_method TEXT,
                user_level TEXT,
                start_date TEXT,
                end_date TEXT,
                direct_payment TEXT,
                coverage_type TEXT,
                subcategories TEXT,
                eligibility_data TEXT,
                taxation_data TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
            )
        `;

        this.db.run(createConfigurationsTable, (err) => {
            if (err) console.error('Error creating configurations table:', err);
        });

        this.db.run(createPopulationsTable, (err) => {
            if (err) console.error('Error creating populations table:', err);
        });

        this.db.run(createCategoriesTable, (err) => {
            if (err) console.error('Error creating categories table:', err);
        });

        this.db.run(createExpenseTypesTable, (err) => {
            if (err) console.error('Error creating expense_types table:', err);
        });
    }

    // Configuration methods
    async getAllConfigurations() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id, client_name, created_at, updated_at 
                FROM benefit_configurations 
                ORDER BY updated_at DESC
            `;
            
            this.db.all(sql, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getConfigurationById(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM benefit_configurations WHERE id = ?`;
            
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    if (row) {
                        row.configuration_data = JSON.parse(row.configuration_data);
                    }
                    resolve(row);
                }
            });
        });
    }

    async saveConfiguration(configData) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO benefit_configurations 
                (id, client_name, configuration_data, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [
                configData.id,
                configData.client_name,
                configData.configuration_data,
                configData.created_at,
                configData.updated_at
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    async updateConfiguration(configData) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE benefit_configurations 
                SET client_name = ?, configuration_data = ?, updated_at = ?
                WHERE id = ?
            `;
            
            this.db.run(sql, [
                configData.client_name,
                configData.configuration_data,
                configData.updated_at,
                configData.id
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    async deleteConfiguration(id) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM benefit_configurations WHERE id = ?`;
            
            this.db.run(sql, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = Database;