const express = require('express');
const db = require('../db');
const slugify = require('slugify');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            'SELECT * FROM companies'
        );

        return res.status(200).json({companies: results.rows});
    } catch(err) {
        return next(err);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        const results = await db.query(
            `
            SELECT c.*, i.id, i.amt, i.paid, i.add_date, i.paid_date 
            FROM companies c
            LEFT JOIN invoices i ON i.comp_code = c.code
            WHERE code = $1
            `, 
            [req.params.code]
        )

        if (results.rows.length) {
            const {code, name, description} = results.rows[0];
            const result = {
                code,
                name,
                description,
                invoices: []
            };
            
            for (let row of results.rows) {
                const {id, amt, paid, add_date, paid_date} = row;
                result.invoices.push({id, amt, paid, add_date, paid_date})
            }
            
            return res.status(200).json({company: result});
        }
        return next();
    } catch(err) {
        return next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const results = await db.query(
            `
            INSERT INTO companies
            VALUES ($1, $2, $3)
            RETURNING code, name, description
            `,
            [
                slugify(req.body.code, {
                    lower: true,
                    locale: 'en'
                }),
                req.body.name,
                req.body.description
            ]
        )
        return res.status(201).json({company: results.rows[0]});
    } catch(err) {
        return next(err);
    }
});

router.put('/:code', async (req, res, next) => {
    try {
        const results = await db.query(
            `
            UPDATE companies
            SET name = $2, description = $3
            WHERE code = $1
            RETURNING code, name, description
            `,
            [
                req.params.code,
                req.body.name,
                req.body.description
            ]
        );
        if (results.rows.length)
            return res.status(200).json({company: results.rows[0]})
        return next();
    } catch(err) {
        return next(err);
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        const results = await db.query(
            `
            DELETE FROM companies
            WHERE code = $1
            RETURNING code
            `,
            [
                req.params.code
            ]
        );

        if (results.rows.length)
            return res.status(200).json({'status': 'deleted'});
        return next()
    } catch(err) {
        return next(err);
    }
});

module.exports = router;