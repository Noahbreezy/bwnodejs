require('dotenv').config();
const express = require('express');
const https = require('https');
const morgan = require('morgan');
const sqlFunctions = require('./sql');
const { body, validationResult } = require('express-validator');

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

const validateStatistic = [
    body('user_id').isInt().withMessage('User ID must be an integer'),
    body('kills').isNumeric().withMessage('Kills must be numeric'),
    body('date').notEmpty().withMessage('Date is required')
];

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

// Search routes
app.get('/users/search', async (req, res) => {
    const { username } = req.query;
    try {
        const users = await db.searchUserByUsername(username);
        res.json(users);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

https.createServer(app).listen(PORT, () => {
    console.log(`HTTPS server running on port ${PORT}`);
});