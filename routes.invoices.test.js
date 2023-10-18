const app = require('./app');
const db = require('./db');
const client = require('supertest')(app)

beforeEach(() => {
    db.query('DELETE FROM companies');
    db.query('DELETE FROM invoices');
    db.query(`INSERT INTO companies VALUES 
        ('apple', 'Apple Computer', 'Maker of OSX.'),
        ('ibm', 'IBM', 'Big blue.')`
    )
    db.query(`INSERT INTO invoices 
        (comp_code, amt, paid, paid_date)
        VALUES 
            ('apple', 100, false, null),
            ('apple', 200, false, null),
            ('apple', 300, true, '2018-01-01'),
            ('ibm', 400, false, null)`
    );
});

afterAll(() => {
    db.end();
})

describe('GET /invoices', () => {
    test('get all invoices', async () => {
        const res = await client.get('/invoices');
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            invoices: [
                {
                    id: expect.any(Number),
                    comp_code: 'apple'
                },
                {
                    id: expect.any(Number),
                    comp_code: 'apple'
                },
                {
                    id: expect.any(Number),
                    comp_code: 'apple'
                },
                {
                    id: expect.any(Number),
                    comp_code: 'ibm'
                }
            ]
        })
    });
});

describe('GET /invoices/:id', () => {
    test('get invoice by id', async () => {
        const results = await db.query(
            `
            SELECT id FROM invoices
            WHERE comp_code = 'apple' AND amt = 300
            `
        );
        const invoice = results.rows[0];
        const res = await client.get(`/invoices/${invoice.id}`);
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            invoice:
            {
                id: expect.any(Number),
                amt: 300,
                paid: true,
                add_date: expect.any(String),
                paid_date: expect.any(String),
                company: {
                    code: 'apple',
                    name: 'Apple Computer',
                    description: 'Maker of OSX.'
                }
            }
        })
    });

    test('get invoice by id - not found', async () => {
        const results = await db.query(
            `
            SELECT id FROM invoices
            WHERE comp_code = 'apple' AND amt = 300
            `
        );
        const res = await client.get('/invoices/-1');
        expect(res.statusCode).toBe(404)
    });
});

describe('POST /invoices/', () => {
    test('add new invoice', async () => {
        const res = await client.post('/invoices')
            .send({
                comp_code: 'apple',
                amt: 50
            });
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({
            invoice:
            {
                id: expect.any(Number),
                comp_code: 'apple',
                amt: 50,
                paid: false,
                add_date: expect.any(String),
                paid_date: null
            }
        })
    });

    test('add new invoice - invalid request', async () => {
        const res = await client.post('/invoices')
            .send({
                invalid: '_test'
            });
        expect(res.statusCode).toBe(500)
    });
});

describe('PUT /invoices/:id', () => {
    test('update invoice by id', async () => {
        const results = await db.query(
            `
            SELECT id FROM invoices
            WHERE comp_code = 'apple' AND amt = 100
            `
        );
        const invoice = results.rows[0];
        const res = await client.put(`/invoices/${invoice.id}`)
            .send({
                amt: 100
            });
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            invoice:
            {
                id: expect.any(Number),
                comp_code: 'apple',
                amt: 100,
                paid: true,
                add_date: expect.any(String),
                paid_date: expect.any(String)
            }
        })
    });

    test('update invoice by id - not found', async () => {
        const res = await client.put('/invoices/-1')
            .send({
                amt: 100
            });
        expect(res.statusCode).toBe(404)
    });
});

describe('DELETE /invoices/:id', () => {
    test('delete invoice by id', async () => {
        const results = await db.query(
            `
            SELECT id FROM invoices
            WHERE comp_code = 'apple' AND amt = 100
            `
        );
        const invoice = results.rows[0];
        const res = await client.delete(`/invoices/${invoice.id}`)

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            status: 'deleted'
        })
    });

    test('delete invoice by id - not found', async () => {
        const res = await client.delete('/invoices/-1')

        expect(res.statusCode).toBe(404)
    });
});