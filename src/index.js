import express, { json } from "express";
import joi from "joi";
import cors from "cors";
import dotenv from "dotenv"
import { MongoClient, ObjectId } from 'mongodb';
dotenv.config();


const app = express();
app.use(json());
app.use(cors());



const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

try {
    await mongoClient.connect();
    db = mongoClient.db("test");
} catch (err) {
    console.log(err.message)
}

    
app.listen(process.env.PORT || 5001, () => {
    console.log("ffc")
})


app.get("/" , async (req, res) => {
    return res.send("oi")
})


app.post("/sign-up", async (req, res) => {
    const { username, avatar } = req.body;
    const user = req.body;

    const userSchema = joi.object({
        username: joi.string().required(),
        avatar: joi.string().required()
    });

    const validation = userSchema.validate(user, { abortEarly: false });

    if (validation.error) {
        const mensagens = validation.error.details.map(detail => detail.message);
        return res.status(422).send(mensagens);
    }

    try {

        const receitaExistente = await db.collection("users").findOne({ username: user.username });

        if (receitaExistente) {
            return res.status(409).send("Usuário já cadastrado")
        }

        await db.collection("users").insertOne(user)
        res.status(201).send("Usuário cadastrado com sucesso")

    } catch (err) {
        return res.status(500).send(err.message)
    }


})


app.post("/tweets", async (req, res) => {
    const { username, tweet } = req.body;
    const tweetPost = req.body;

    const tweetSchema = joi.object({
        username: joi.string().required(),
        tweet: joi.string().required(),
    });

    const validation = tweetSchema.validate(tweetPost, { abortEarly: false });

    if (validation.error) {
        const mensagens = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(mensagens);
    }

    try {
       
        const tweetVerification = await db.collection("users").findOne({ username: tweetPost.username });

        if (!tweetVerification) {
            return res.sendStatus(401); 
        }

        await db.collection("tweets").insertOne(tweetPost);
        res.status(201).send("Tweetado com sucesso");

    } catch (err) {
        return res.status(500).send(err.message);
    }
});


app.get("/tweets", async (req, res) => {

    try {

        const users = await db.collection("users").find().toArray();
        const tweets = await db.collection("tweets").find().toArray();

        const avatarTweets = tweets.map(tweet => {
            const user = users.find(user => user.username === tweet.username);

            if (user) {
                return {
                    _id: tweet._id,
                    username: tweet.username,
                    avatar: user.avatar,
                    tweet: tweet.tweet,
                };
            }
        });
        return res.send(avatarTweets.reverse()).status(200)

    } catch (err) {
        return res.sendStatus(500);

    }

})
    



app.put("/tweets/:id", async (req, res) => {

    const { id } = req.params;
    const tweet = req.body;

    const tweetSchema = joi.object({
        username: joi.string().required(),
        tweet: joi.string().required()

    });

    const validation = tweetSchema.validate(tweet, { abortEarly: false })

    if (validation.error) {
        const mensagens = validation.error.details.map((detail => detail.message))
        return res.status(422).send(mensagens)
    }

    try {
        const tweetSelected = await db.collection("tweets").updateOne({
            _id: new ObjectId(id)
        }, {
            $set: {
                username: tweet.username,
                tweet: tweet.tweet
            }
        })

        if(tweetSelected.matchedCount === 0){
            return res.status(404).send("Esse tweet não existe")
        }
        res.send("Tweet atualizado")

    } catch (err) {
        return res.status(500).send(err.message)
    }





})

app.delete("/tweets/:id", async (req, res) => {
    
    const { id } = req.params;

    try{

        const tweetDeleted = await db.collection("tweets").deleteOne({
            _id: new ObjectId(id)
        });

        if(tweetDeleted.deletedCount === 0 ){
            return res.status(404).send("Esse tweet não existe")
        }

        return res.status(204).send("Tweet deletado com sucesso")


    }catch(err){
        return res.status(500).send(err.message)
    }



})
