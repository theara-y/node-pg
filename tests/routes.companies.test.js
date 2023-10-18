const app = require('../app');
const db = require('../db');
const client = require('supertest')(app)

beforeEach(() => {
    db.query('DELETE FROM companies');
    db.query('DELETE FROM invoices');
    db.query(`INSERT INTO companies VALUES 
        ('apple', 'Apple Computer', 'Maker of OSX.'),
        ('ibm', 'IBM', 'Big blue.')`
    )
});

afterAll(() => {
    db.end();
})

describe('GET /companies', () => {
    test('get all companies', async () => {
        const res = await client.get('/companies');
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            companies: [
                {
                    code: 'apple',
                    name: 'Apple Computer',
                    description: 'Maker of OSX.'
                },
                {
                    code: 'ibm',
                    name: 'IBM',
                    description: 'Big blue.'
                }
            ]
        })
    });
});

describe('GET /companies/:code', () => {
    test('get company by code', async () => {
        const res = await client.get('/companies/apple');
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            company:
            {
                code: 'apple',
                name: 'Apple Computer',
                description: 'Maker of OSX.',
                invoices: expect.any(Array),
                industries: expect.any(Array)
            }
        })
    });

    test('get company by code - not found', async () => {
        const res = await client.get('/companies/_test');
        expect(res.statusCode).toBe(404)
    });
});

describe('POST /companies/', () => {
    test('add new company', async () => {
        const res = await client.post('/companies')
            .send({
                code: ' TEST name ',
                name: '_test name',
                description: '_test description'
            });
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({
            company:
            {
                code: 'test-name',
                name: '_test name',
                description: '_test description'
            }
        })
    });

    test('add new company - invalid request', async () => {
        const res = await client.post('/companies')
            .send({
                invalid: '_test',
                name: '_test name',
                description: '_test description'
            });
        expect(res.statusCode).toBe(500)
    });
});

describe('PUT /companies/:code', () => {
    test('update company by code', async () => {
        const res = await client.put('/companies/apple')
            .send({
                name: 'testName',
                description: 'testDescription'
            });
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            company:
            {
                code: 'apple',
                name: 'testName',
                description: 'testDescription'
            }
        })
    });

    test('update company by code - not found', async () => {
        const res = await client.put('/companies/_test')
            .send({
                name: '_test name',
                description: '_test description'
            });
        expect(res.statusCode).toBe(404)
    });
});

describe('DELETE /companies/:code', () => {
    test('delete company by code', async () => {
        const res = await client.delete('/companies/apple')

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            status: 'deleted'
        })
    });

    test('delete company by code - not found', async () => {
        const res = await client.delete('/companies/_test')

        expect(res.statusCode).toBe(404)
    });
});