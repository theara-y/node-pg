const app = require('../app');
const db = require('../db');
const client = require('supertest')(app)

beforeEach(() => {
    db.query('DELETE FROM companies');
    db.query('DELETE FROM industries');

    db.query(`INSERT INTO companies VALUES 
        ('apple', 'Apple Computer', 'Maker of OSX.'),
        ('ibm', 'IBM', 'Big blue.')`
    );
    db.query(`INSERT INTO industries (code, industry) 
        VALUES 
        ('acct', 'Accounting'),
        ('aero', 'Aerospace')`
    );
    db.query(`INSERT INTO companies_industries (company_code, industry_code)
        VALUES 
        ('apple', 'acct'),
        ('ibm', 'aero')`
    );
});

afterAll(() => {
    db.end();
})

describe('GET /industries', () => {
    test('get all industries', async () => {
        const res = await client.get('/industries');
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            industries: [
                {
                    code: 'acct',
                    industry: 'Accounting'
                },
                {
                    code: 'aero',
                    industry: 'Aerospace'
                }
            ]
        })
    });
});

describe('GET /industries/:code', () => {
    test('get industry by code', async () => {
        const res = await client.get('/industries/acct');
        // expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            industry:
            {
                code: 'acct',
                industry: 'Accounting',
                companies: [
                    {
                        code: 'apple',
                        name: 'Apple Computer',
                        description: 'Maker of OSX.'
                    }
                ]
            }
        })
    });

    test('get industry by code - not found', async () => {
        const res = await client.get('/industries/_test');
        expect(res.statusCode).toBe(404)
    });
});

describe('POST /industries/', () => {
    test('add new industry', async () => {
        const res = await client.post('/industries')
            .send({
                code: 'test NAME    ',
                industry: 'test name'
            });
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({
            industry:
            {
                code: 'test-name',
                industry: 'test name'
            }
        })
    });

    test('add new industry - invalid request', async () => {
        const res = await client.post('/industries')
            .send({
                invalid: '_test'
            });
        expect(res.statusCode).toBe(500)
    });
});

describe('DELETE /industries/:code', () => {
    test('delete industry by code', async () => {
        const res = await client.delete('/industries/acct')

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            status: 'deleted'
        })
    });

    test('delete industry by code - not found', async () => {
        const res = await client.delete('/industries/_test')

        expect(res.statusCode).toBe(404)
    });
});