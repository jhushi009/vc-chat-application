import { generateStreamToken } from "../lib/stream.js";

export async function generateStreamToken(req,res)
{
    try{
        const token = generateStreamToken(req.user.id);

        res.status(200).json({token});
    }catch(error)
    {
        console.log("error in getstrramtoken controller:",error.message);
        res.status(400).json({message:"internal server error"});
    }
}