const express = require('express');
const db = require('../db');
const slugify = require('slugify');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            'SELECT * FROM industries'
        );

        return res.status(200).json({industries: results.rows});
    } catch(err) {
        return next(err);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        const results = await db.query(
            `
            SELECT i.code icode, i.industry, c.code ccode, c.name, c.description 
            FROM industries i
            LEFT JOIN companies_industries ic ON i.code = ic.industry_code
            LEFT JOIN companies c ON c.code = ic.company_code
            WHERE i.code = $1
            `, 
            [req.params.code]
        )

        if (results.rows.length !== 0) {
            const {icode, industry} = results.rows[0];
            const result = {
                code: icode,
                industry,
                companies: []
            };
            
            for (let row of results.rows) {
                const {ccode, name, description} = row;
                result.companies.push({code: ccode, name, description})
            }
            
            return res.status(200).json({industry: result});
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
            INSERT INTO industries
            VALUES ($1, $2)
            RETURNING code, industry
            `,
            [
                slugify(req.body.code, {
                    lower: true,
                    locale: 'en'
                }),
                req.body.industry
            ]
        )
        return res.status(201).json({industry: results.rows[0]});
    } catch(err) {
        return next(err);
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        const results = await db.query(
            `
            DELETE FROM industries
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