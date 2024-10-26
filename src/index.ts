import express, { Express, Request, Response } from "express";
import mongoose from "mongoose";
import twilio from "twilio";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { AffectedPerson } from "./database/AffectedPersons";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose.connect(`${process.env.DATABASEURL}`)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

const twilioClient = twilio(`${process.env.TWILIO_ACCOUNT_SID}`, `${process.env.TWILIO_AUTH_TOKEN}`);


const initialModel = new ChatGoogleGenerativeAI({
  model: "gemini-pro", 
  apiKey: `${process.env.GOOGLE_API_KEY}`, 
});

const queryModel = new ChatMistralAI({
  model: "mistral-large-latest",
  temperature: 0,
  apiKey: `${process.env.MISTRAL_API_KEY}`, 
});




app.post("/whatsapp", async (req: Request, res: Response) => {
  const incomingMessage = req.body.Body;
  const from = req.body.From;
  const body= req.body;
  console.log(body);



 
  const initialResponse = await queryModel.invoke([{ role: "user", content: incomingMessage }]);
  const initialResponseContent = initialResponse.content?.toString() || JSON.stringify(initialResponse.content);

    if (/disease|sick|corona|covid|affected/i.test(initialResponseContent)) {
      
        const prompt = "It seems you're reporting a disease. Could you please provide your name, Aadhaar number, and current location in this format: Name: [Your Name], Aadhaar: [Your Aadhaar], Location: [Your Location]?";
  await twilioClient.messages.create({
    body: prompt,
    from: "whatsapp:+14155238886",
    to: from,
  }); } else if (/query|who is affected|how many got affected |affected individuals|disease cases/i.test(initialResponseContent)) {
   
    try {
        const affectedPersons = await AffectedPerson.find();
  
        if (affectedPersons.length === 0) {
          await twilioClient.messages.create({
            body: "There are currently no affected individuals reported.",
            from: "whatsapp:+14155238886",
            to: from,
          });
        } else {
          const affectedList = affectedPersons.map(person => `Name: ${person.name}, Aadhaar: ${person.aadhaar}, Location: ${person.location}`).join("\n");
  
          await twilioClient.messages.create({
            body: `Here are the affected individuals:\n${affectedList}`,
            from: "whatsapp:+14155238886",
            to: from,
          });
        }
      } catch (error) {
        console.error("Error retrieving affected individuals:", error);
        res.status(500).send("Error retrieving the data.");
        return;
      }
    
  } 

  if (/Name:\s*([\w\s]+),\s*Aadhaar:\s*(\d+),\s*Location:\s*([\w\s]+)/i.test(incomingMessage)) {
    const [ name, aadhaar, location] = incomingMessage.match(/Name:\s*([\w\s]+),\s*Aadhaar:\s*(\d+),\s*Location:\s*([\w\s]+)/i) || [];

    const affectedPerson = new AffectedPerson({
      name: name.trim(),
      aadhaar: aadhaar.trim(),
      location: location.trim(),
    });

    try {
       
        await affectedPerson.save();
        console.log("Affected person saved:", affectedPerson);
        const confirmationMessage = `Thank you, ${name}. Your information has been recorded.`;
        await twilioClient.messages.create({
          body: confirmationMessage,
          from: "whatsapp:+14155238886",
          to: from,
        });
      } catch (error) {
        console.error("Error saving affected person:", error);
        res.status(500).send("Error saving the information.");
        return;
      }
 

  res.status(200).send("Message processed");
    }
});

app.get("/hello", (req: Request, res: Response) => {
  res.send("Hello World");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
