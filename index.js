const express = require('express');
const db = require('better-sqlite3')('epq.db');
const userdb = require('better-sqlite3')('user.db');
const cors = require('cors');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const xml2js = require('xml2js');


const getUserByEmail = (email) => {
    const row = userdb.prepare(`SELECT * FROM users WHERE email = ?`).get(email);        
    if (!row) {
            console.log("User not found");
        } else {
            user = row;
            return user;
        }
}; 


const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;


app.get('/', (req, res) => {
    res.send('Hello World!')
});

// These are the User endpoints

app.get(`/users`, (req, res) => {
    userdb.prepare(`SELECT * FROM users`, (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send(`Internal server error`);
        } else {
            res.send(rows);
        }
    });
});

app.get(`/users/:id`, (req, res) => {
    const { id } = req.params;
    userdb.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).send(`Internal server error`);
        } else if (!row) {
            res.status(404).send(`User not found`);
        } else {
            res.send(row);
        }
    });
});

app.post(`/users`, (req, res) => {
    const email = (req.body.email);
    const password = (req.body.password);
    console.log(`email: ${email}, password: ${password}`);
    if (!email || !password) {
        res.status(400).send(`Invalid credentials provided, please try again`);
    } else if (getUserByEmail(email)) {
        res.status(400).send(`Invalid credentials provided, please try again`);
    } else {
        const insert = userdb.prepare(`INSERT INTO users (email, password, role) VALUES (?, ?, ?)`);
        insert.run( email, password, "user");
        try {
            getUserByEmail(email);
            if (!user) {
                res.status(400).send()
            } else {
                res.status(201).send("User created successfully");
            }
        } catch (error) {
            console.error(error.message);
            res.status(500).send(`Internal server error`);
        }
    }
});

// Updating user endpoint
// app.put(`/users/:id`, (req, res) => {
//     const { id } = req.params;
//     const { email, password, fName, lName} = req.body;
     
// })

app.delete(`/users/:id`, (req, res) => {
    const { id } = req.params;
    userdb.run(`DELETE FROM pq-users where id = ?`, [id], function (err) {
        if (err) {
            console.error(err.message);
            res.status(500).send(`Internal server error`);
        } else if (this.change === 0) {
            res.status(404).send(`User not found`);
        } else {
            res.status(204).send();
        }
    });
});


// These endpoints are PQ specific

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
        // This data may be used in a future version

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
        res.json(speeches);
    } catch (error) {
        console.error(error.message);
    }
});

app.listen(port, () => {
    console.log(`Backend app listening on port ${port}`)
})