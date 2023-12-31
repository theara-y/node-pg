const express = require('express');
const db = require('../db');
const ExpressError = require('../expressError');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            'SELECT id, comp_code FROM invoices'
        );
        return res.status(200).json({invoices: results.rows});
    } catch(err) {
        return next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const results = await db.query(
            `
            SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.*
            FROM invoices i
            JOIN companies c ON c.code = i.comp_code
            WHERE i.id = $1
            `, 
            [req.params.id]
        )

        if (results.rows.length) {
            let {id, amt, paid, add_date, paid_date, code, name, description} = results.rows[0];
            return res.status(200).json({
                invoice: {
                    id,
                    amt,
                    paid,
                    add_date,
                    paid_date,
                    company: {
                        code,
                        name,
                        description
                    }
                }
            });
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
            INSERT INTO invoices
                (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date
            `,
            [
                req.body.comp_code,
                req.body.amt
            ]
        )
        return res.status(201).json({invoice: results.rows[0]});
    } catch(err) {
        return next(err);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const { amt, paid: paidReq } = req.body;
        let newPaidDate = null;

        const paidResult = await db.query(
            `
            SELECT paid, paid_date FROM invoices
            WHERE id = $1
            `,
            [id]
        )

        if (paidResult.rows.length === 0) {
            throw new ExpressError(`Invoice not found: ${id}`, 404)
        }
    
        const {paidRes, paidDateRes} = paidResult.rows[0]
        if (!paidDateRes && paidReq)
            newPaidDate = new Date();
        else if (!paidReq)
            newPaidDate = null;
        else
            newPaidDate = paidDateRes
    
        const results = await db.query(
            `
            UPDATE invoices
            SET amt = $2, paid = $3, paid_date = $4
            WHERE id = $1
            RETURNING id, comp_code, amt, paid, add_date, paid_date
            `,
            [id, amt, paidReq, newPaidDate]
        );

        return res.status(200).json({invoice: results.rows[0]})
    } catch(err) {
        return next(err);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const results = await db.query(
            `
            DELETE FROM invoices
            WHERE id = $1
            RETURNING id
            `,
            [
                req.params.id
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