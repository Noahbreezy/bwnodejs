const mysql = require('mysql2');
require('dotenv').config();

// Class for handling all SQL queries.
class sqlFunctions {

    constructor() {
        // Create a connection pool using environment variables
        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            connectionLimit: 10
        });
    }

    // Standard code for making queries and returning output if needed.
    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.pool.query(sql, args, (err, rows) => {
                if (err)
                    return reject(err);
                resolve(rows);
            });
        });
    }

    // CRUD operations for users
    createUser(data) {
        const sql = 'INSERT INTO users (username, password, first_name, last_name) VALUES (?, ?, ?, ?)';
        return this.query(sql, [data.username, data.password, data.first_name, data.last_name]);
    }

    updateUser(id, data) {
        const sql = 'UPDATE users SET username = ?, password = ?, first_name = ?, last_name = ? WHERE id = ?';
        return this.query(sql, [data.username, data.password, data.first_name, data.last_name, id]);
    }

    deleteUser(id) {
        const sql = 'DELETE FROM users WHERE id = ?';
        return this.query(sql, [id]);
    }

    getAllUsers() {
        const sql = 'SELECT * FROM users';
        return this.query(sql);
    }

    // CRUD operations for statistics
    createStatistic(data) {
        const sql = 'INSERT INTO statistics (user_id, kills, date) VALUES (?, ?, ?)';
        return this.query(sql, [data.user_id, data.kills, data.date]);
    }

    updateStatistic(id, data) {
        const sql = 'UPDATE statistics SET user_id = ?, kills = ?, date = ? WHERE id = ?';
        return this.query(sql, [data.user_id, data.kills, data.date, id]);
    }

    deleteStatistic(id) {
        const sql = 'DELETE FROM statistics WHERE id = ?';
        return this.query(sql, [id]);
    }

    getAllStatistics() {
        const sql = 'SELECT * FROM statistics';
        return this.query(sql);
    }

    // Get statistics with a limit and offset
    getStatisticsWithLimitOffset(limit, offset) {
        const sql = 'SELECT * FROM statistics LIMIT ? OFFSET ?';
        return this.query(sql, [limit, offset]);
    }

    // Search for statistics by date
    searchStatisticsByDate(date) {
        const sql = 'SELECT * FROM statistics WHERE date = ?';
        return this.query(sql, [date]);
    }

    // Search for users by username
    searchUserByUsername(username) {
        const sql = 'SELECT * FROM users WHERE username LIKE ?';
        return this.query(sql, [`%${username}%`]);
    }
}

module.exports = sqlFunctions;