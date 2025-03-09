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
            mergeAttrs: true,
        });
        const debate = result.akomaNtoso.debate;
        const speakers = debate.meta.references.TLCPerson;
        const roles = debate.meta.references.TLCRole;
        const question = debate.debateBody.debateSection.question;
        const speech = debate.debateBody.debateSection.speech;
        console.log(speakers);
        res.json({speakers, roles, question, speech});  
} catch (error) {
    console.error(error.message);
}
});

app.get('/speechtest', async (req, res) => {
    console.log("Trying the test XML endpoint");
    const url = `https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-03-04/debate/mul@/dbsect_9.xml`;
    try {
        const response = await axios.get(url, {responseType: 'text'});
        const result = await parseStringPromise(response.data, {
            explicitArray: false,
            mergeAttrs: true,
        });
        // Here we're extracting the information we want from the debate section and using it to build a new JSON response for react
        const debate = result.akomaNtoso.debate;
        const speakers = debate.meta.references.TLCPerson;
        const roles = debate.meta.references.TLCRole;
        const questionRes = debate.debateBody.debateSection.question;
        const question = [];
        questionRes.forEach(questionRes => {
            asker = questionRes.p.b[0];
            recipient = questionRes.p.b[1];
            question.push({asker, recipient,});
        });
        const speechRes = debate.debateBody.debateSection.speech;
        const speech = [];
        speechRes.forEach(speechRes => {
            const speaker = speechRes.from._;
            const eId = speechRes.eId;
            let fullText = "";
            if (speechRes.p.length > 1) {
                speechRes.p.forEach(p => {
                    fullText += p._;
                })
            } else {
                fullText = speechRes.p._;
            }
            speech.push({speaker, fullText, eId});
        });
        res.json({speakers, roles, question, speech});
    } catch (error) {
        console.error(error.message);
    }
    });


app.get(`/api/fetch-xml`,  async (req, res) => {
    const xmlUrl = req.query.url;
    console.log(`Fetching ${xmlUrl}`);
    try {
        const response = await axios.get(
            xmlUrl, 
            {responseType: 'text'}
        );
        const result = await parseStringPromise(response.data, {
            explicitArray: false,
            mergeAttrs: true,
        });
        const debate = result.akomaNtoso.debate;
        // This data may be used in a future iteration

        // const speakers = debate.meta.references.TLCPerson;
        // const roles = debate.meta.references.TLCRole;
        // const questionRes = debate.debateBody.debateSection.question;
        // const questions = [];
        // questionRes.forEach(questionRes => {
        //     asker = questionRes.p.b[0];
        //     recipient = questionRes.p.b[1];
        //     questions.push({asker, recipient});
        // });
        const speechRes = debate.debateBody.debateSection.speech;
        const speeches = [];
        speechRes.forEach(speechRes => {
            const speaker = speechRes.from._;
            let fullText = "";
            const eId = speechRes.eId;
            if (speechRes.p.length > 1) {
                speechRes.p.forEach(p => {
                    fullText += p._;
                })
            } else {
                fullText = speechRes.p._;
            }
            speeches.push({speaker, fullText, eId});
        });
        // res.json({speakers, roles, questions, speeches});
        return speeches;
    } catch (error) {
        console.error(error.message);
    }
});

app.listen(port, () => {
    console.log(`Backend app listening on port ${port}`)
})