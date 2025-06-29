import  {StreamChat} from "stream-chat"
import "dotenv/config";

const apiKey = process.env.STEAM_API_KEY;
const apiSecret = process.env.STEAM_API_SECRET;

if(!apiKey || !apiSecret)
{
    console.error("stream api key or secret is missing");
}

const streamClient = StreamChat.getInstance(apiKey,apiSecret);

export const upsertStreamUser = async (userData)=>
{
    try{
        await streamClient.upsertUsers([userData]);
        return userData;

    }catch(error)
    {
        console.error("error upserting stream user:",error);
    }
};
export const generateStreamToken = (req, res) => {
    try {
        const userId = req.user.id.toString();
        const token = streamClient.createToken(userId);
        res.json({ token });
    } catch (error) {
        console.error("error generating stream token", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};