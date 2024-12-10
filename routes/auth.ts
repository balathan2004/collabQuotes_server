import express, { Request, Response, Router } from "express";
import supabase from "../utils/supabase_client";
import supabaseAdmin from "../utils/supabase_admin";
import { AuthResponseConfig, UserDataInterface } from "../utils/interfaces";
import { generateFromEmail, generateUsername } from "unique-username-generator";
import { AvatarGenerator } from 'random-avatar-generator';
 
const generator = new AvatarGenerator();
 
// Simply get a random avatar

// Create a router instance
const app = Router();

interface Props {
  email: string;
  password: string;
}

app.post("/login", async (req: Request, res: Response) => {
  const { email, password }: Props = req.body;

  console.log("requested", email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (data && data.user) {
    const userData = data.user;

    res.cookie("collabQuotes_uid", userData.id, {
      maxAge: 2592000000,
      sameSite: "none",
      httpOnly: true,
      secure: true,
    });
    res.json({
      status: 200,
      message: "Logged In",
      credentials: userData,
    });
  } else {
    console.log(error);

    res.json({
      status: 300,
      message: "Invalid Authentication",
      credentials: null,
    });
  }
});

app.post("/register", async (req: Request, res: Response) => {
  const { email, password }: Props = req.body;

  let response = await supabase.auth.signUp({ email: email, password });
  if (response) {
    const { data, error } = response;
    if (data && data.user) {

      const username=generateUsername("-",4,20,"user")

      const userData:UserDataInterface={
        username:username,
        userId:data.user.id,
        profile_url:generator.generateRandomAvatar(),
        email:email,
        createdAt:new Date().getTime()

      }

      const responseData= (await supabase.from("users").insert(userData)).data

      if(responseData){
        res.json({
          status: 200,
          message: "Account Created",
        });
      }


    
    } else {
      res.json({
        status: 300,
        message: "Try again later",
      });
    }
  } else {
    res.json({ message: "hi account created" });
  }
});

app.get("/login_cred", async (req: Request, res: Response): Promise<any> => {
  const collabQuotes_uid: string = req.cookies?.collabQuotes_uid || "";

  console.log("login cred req", collabQuotes_uid);

  if (collabQuotes_uid) {
    const userData = (
      await supabaseAdmin.auth.admin.getUserById(collabQuotes_uid)
    ).data.user;
    console.log(userData);
    if (userData) {
      res.json({
        status: 200,
        message: "Logged In",
        credentials: userData,
      });
    } else {
      res.json({
        status: 300,
        message: "Invalid Authentication",
        credentials: null,
      });
    }
  } else {
    res.json({
      status: 300,
      message: "No Uid Found",
      credentials: null,
    });
  }
});

export default app;