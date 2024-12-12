import { User } from "@supabase/supabase-js";

export interface ResponseConfig {
  status: 200 | 300 | 400;
  message: string;
}

export interface AuthResponseConfig extends ResponseConfig {
  credentials: Object|null;
}

export interface ProfileResponseCofig extends ResponseConfig{

  userData:UserDataInterface |null,
  userPosts:QuoteInterface[]|[]

}

export interface UserDataInterface{

userId:string,
username:string,
email:string,
createdAt:number,
profile_url:string
}


export interface QuoteInterface{
  quote:string;
  author:string;
  userId:string;
  quoteId:string;
  createdAt:number;
  username:string
}

