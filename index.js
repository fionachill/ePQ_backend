const express = require('express');
const db = require('better-sqlite3')('epq.db');
const cors = require('cors');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { parseStringPromise } = require('xml2js');
const xml2js = require('xml2js');

const parser = new xml2js.Parser();

const app = express();
app.use(cors());
const port = 3000;


app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.get('/pqs', (req, res) => {
    console.log("Trying the /pqs endpoint");
    const results = "id, due_oireachtas, question, pqref";
    const rows = db.prepare(`SELECT ${results} FROM pqs ORDER BY id DESC LIMIT 10`).all();
    res.json(rows);
});

app.get('/sample', async (req, res) => {
    console.log("Trying the test XML endpoint");
    const url = `https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-03-04/debate/mul@/dbsect_9.xml`;
    try {
        const response = await axios.get(
            url, 
            {responseType: 'text'}
        );
        const result = await parseStringPromise(response.data, {
            explicitArray: false,
            explicitCharkey: true,
            mergeAttrs: true,
            attrNameProcessors: [name => `${name}`],
        });
        // const debate = result.akomoNtoso.debate;
        console.log(result);
        res.json(result);
} catch (error) {
    console.error(error.message);
}
});


app.get(`/api/fetch-xml`,  async (req, res) => {
    const xmlUrl = req.query.url;
    console.log("You're in.....the xml endpoint");
    console.log(`Attempting to fetch ${xmlUrl}`);
    try {
        const response = await axios.get(
            xmlUrl, 
            {responseType: 'text'}
        );
        const result = await parseStringPromise(response.data, {
            explicitArray: false,
            ignoreAttrs: true,
            attrNameProcessors: [name => `${name}`],
        });
        const debate = result.akomaNtoso.debate;
        const speech = debate.debateBody.debateSection.speech;
        console.log(speech);
        res.json(speech);   
    } catch (error) {
        console.error(error.message);
    }
});

app.listen(port, () => {
    console.log(`Backend app listening on port ${port}`)
})