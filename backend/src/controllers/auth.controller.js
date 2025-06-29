import User from "../models/User.js"
import jwt from "jsonwebtoken";
import {upsertStreamUser} from "../lib/stream.js"

export async function signup(req,res){
    const {email,password,fullName} = req.body;
    try{
        if(!email || !password || !fullName )
        {
            res.status(400).json({message:"all fields are required"});
        }

        if(password.length < 6)
        {
            return res.status(400).json({message:"password must contain 6 characters"});
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
        }

        const existingUser = await User.findOne({email});
        if(existingUser)
        {
            return res.status(400).json({message:"email already exists"});
        }

        const idx = Math.floor(Math.random()*100)+1;
        const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;



        const newUser = await User.create({
            email,
            fullName,
            password,   
            profilePic: randomAvatar,
        });

        try{
            await upsertStreamUser({
                id:newUser._id.toString(),
                name:newUser.fullName,
                image:newUser.profilePic || "",
            });
        }catch(error)
        {
            console.log("error creating stream user:",error)
        }



        const token = jwt.sign({userId:newUser._id},process.env.JWT_SECRET_KEY,{
            expiresIn:"7d"
        })
        
        res.cookie("jwt",token,{
            maxAge:7*24*60*1000,
            httpOnly:true,
            sameSite:"strict",
            secure:process.env.NODE_ENV === "production"
        })

        res.status(200).json({success:true,user:newUser})
}
catch(error)
{
   console.log("error in signup controller ",error);
   res.status(500).json({message:"Internal server error"});
}
}

export async function login(req,res){
    const {email,password} = req.body;

    try{
        if(!email || !password )
        {
            res.status(400).json({message:"all fields are required"});
        }

        const user = await User.findOne({email});
        if(!user) return res.status(401).json({message:"invalid email"});

        const isPasswordCorrect = await user.matchPassword(password)

        if(!isPasswordCorrect) return res.status(401).json({message:"invalid email or password"});

        const token = jwt.sign({userId: user._id},process.env.JWT_SECRET_KEY,{
            expiresIn:"7d"
        })
        
        res.cookie("jwt",token,{
            maxAge:7*24*60*1000,    
            httpOnly:true,
            sameSite:"strict",
            secure:process.env.NODE_ENV === "production"
        })

        res.status(200).json({sucess:true,user:user})


    }
    catch(error)
    {
        console.log("error in signup controller ",error);
        res.status(500).json({message:"Internal server error"});
    }
    
}


export function logout(req,res){
    res.clearCookie("jwt");
    res.status(200).json({success:true,message:"logout succesfull"});
}

export  async function onboard(req,res){
    try{
        const userId = req.user._id

        const {fullName,bio,nativeLanguage,learningLanguage,location}=req.body;
        if(!fullName || !nativeLanguage || !learningLanguage || !location||!bio)
        {
            return res.status(400).json({
                message:"all fields are required",
                missingFields:
                [!fullName && "fullName",
                !bio && "bio",
                !nativeLanguage && "nativeLanguage",
                !learningLanguage && "learningLanguage",
                !location && "location",].filter(Boolean),

            })
        }
        
        const updateUser = await User.findByIdAndUpdate(
            userId,
            {
                ...req.body,
                isOnboarded:true, 
                
            },{new:true}
        );

        if(!updateUser)
        {
            return res.status(400).json({message:"user not found"});

        }
        try{
            await upsertStreamUser({
            id:updateUser._id.toString(),
            name:updateUser.fullName,
            image:updateUser.profilePic ||"",
        })
        console.log(`stream user updated after onboarding for${updateUser.fullName}`);
        }catch(error)
        {
            console.log("error updating stream user during onboarding:",error);
            res.status(500).json({message:"internal server error"});
        }

        res.status(200).json({success:true,user:updateUser})
    }catch(error)
    {
        console.error("onboarding error",error);
        res.status(500).json({message:"internal server error"});
    }
}