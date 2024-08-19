require('dotenv').config();
const express = require('express');
const https = require('https');
const morgan = require('morgan');
const sqlFunctions = require('./sql');
const { body, query, validationResult } = require('express-validator');

const app = express();
app.use(express.json());
app.use(morgan('dev'));

const db = new sqlFunctions();

const PORT = process.env.PORT || 3000;

// Validation middleware
const validateUser = [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one capital letter and one number'),
    body('first_name').notEmpty().withMessage('First name is required').isAlpha().withMessage('First name cannot contain numbers'),
    body('last_name').notEmpty().withMessage('Last name is required').isAlpha().withMessage('Last name cannot contain numbers')
];

const validateUserDetails = [
    query('username').optional().isString().withMessage('Username must be a string'),
    query('first_name').optional().isString().withMessage('First name must be a string'),
    query('last_name').optional().isString().withMessage('Last name must be a string')
];

const validateStatistic = [
    body('user_id').isInt().withMessage('User ID must be an integer'),
    body('kills').isNumeric().withMessage('Kills must be numeric'),
    body('date').notEmpty().withMessage('Date is required')
];

const validateDateRange = [
    query('start_date').notEmpty().withMessage('Start date is required').isISO8601().withMessage('Start date must be a valid date'),
    query('end_date').optional().isISO8601().withMessage('End date must be a valid date')
];

const validateDate = [
    query('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Date must be a valid date')
];

const validateKills = [
    query('kills').isInt({ min: 0 }).withMessage('Kills must be a positive integer')
];

// Middleware to check if the request is from localhost
const checkLocalhost = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    if (ip === '127.0.0.1' || ip === '::1') {
        next();
    } else {
        res.status(403).send('Forbidden: This endpoint can only be accessed from localhost');
    }
};

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Routes for users
app.post('/users', validateUser, handleValidationErrors, async (req, res) => {
    try {
        await db.createUser(req.body);
        res.status(201).send('User created');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.put('/users/:id', validateUser, handleValidationErrors, async (req, res) => {
    try {
        await db.updateUser(req.params.id, req.body);
        res.send('User updated');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete('/users/:id', async (req, res) => {
    try {
        await db.deleteUser(req.params.id);
        res.send('User deleted');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/users', async (req, res) => {
    try {
        const users = await db.getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Search users by username
app.get('/users/search', async (req, res) => {
    const { username } = req.query;
    try {
        const users = await db.searchUserByUsername(username);
        res.json(users);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Route for searching users by username, first_name, and last_name
app.get('/users/searchByDetails', validateUserDetails, handleValidationErrors, async (req, res) => {
    const { username = '', first_name = '', last_name = '' } = req.query;

    try {
        const users = await db.searchUserByDetails(username, first_name, last_name);
        res.json(users);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Route to delete users with less than a certain amount of kills
app.delete('/users/deleteByKills', checkLocalhost, validateKills, handleValidationErrors, async (req, res) => {
    const { kills } = req.query;

    try {
        await db.deleteUsersWithLessThanKills(parseInt(kills));
        res.send('Users deleted');
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// Routes for statistics
app.post('/statistics', validateStatistic, handleValidationErrors, async (req, res) => {
    try {
        await db.createStatistic(req.body);
        res.status(201).send('Statistic created');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.put('/statistics/:id', validateStatistic, handleValidationErrors, async (req, res) => {
    try {
        await db.updateStatistic(req.params.id, req.body);
        res.send('Statistic updated');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete('/statistics/:id', async (req, res) => {
    try {
        await db.deleteStatistic(req.params.id);
        res.send('Statistic deleted');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/statistics', async (req, res) => {
    try {
        const statistics = await db.getAllStatistics();
        res.json(statistics);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Statistics pagination
app.get('/statistics/paginate', async (req, res) => {
    const { limit, offset } = req.query;
    try {
        const statistics = await db.getStatisticsWithLimitOffset(parseInt(limit), parseInt(offset));
        res.json(statistics);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Searching statistics by date range
app.get('/statistics/search', validateDateRange, handleValidationErrors, async (req, res) => {
    const { start_date, end_date } = req.query;
    const endDate = end_date || new Date().toISOString().split('T')[0]; // Default to current date if end_date is not provided

    if (new Date(start_date) > new Date(endDate)) {
        return res.status(400).send('End date must be more recent than start date');
    }

    try {
        const statistics = await db.searchStatisticsByDateRange(start_date, endDate);
        res.json(statistics);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Searching statistics by a specific date
app.get('/statistics/searchByDate', validateDate, handleValidationErrors, async (req, res) => {
    const { date } = req.query;

    try {
        const statistics = await db.searchStatisticsByDate(date);
        res.json(statistics);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

https.createServer(app).listen(PORT, () => {
    console.log(`HTTPS server running on port ${PORT}`);
});