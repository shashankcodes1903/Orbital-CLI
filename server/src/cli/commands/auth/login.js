import { cancel, confirm, intro, isCancel, outro } from "@clack/prompts";
import { logger } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";

import chalk from "chalk";
import { Command } from "commander";
import fs from "node:fs/promises";
import open from "open";
import os from "os";
import path from "path";
import yoctoSpinner from "yocto-spinner";
import * as z from "zod/v4";
import dotenv from "dotenv";
import prisma from "../../../lib/db.js";


dotenv.config();

const URL = "http://localhost:3005";
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

export async function loginAction(opts) {
    const options = z.object({
        serverUrl: z.string().optional(),
        clientId: z.string().optional()
    })

    const serverUrl = options.serverUrl || URL;
    const clientID = options.clientId || CLIENT_ID

    intro(chalk.bold("🔐Auth CLI Login"))

    //TODO:CHANGE THIS WITH TOKEN MANAGEMENT UTILS
    const existingToken = false;
    const expired = false;

    if (existingToken && !expired) {
        const shouldReAuth = await confirm({
            message: "You are already loggedIn. Do you want to login Again?",
            initialValue: false
        })

        if (isCancel(shouldReAuth) || !shouldReAuth) {
            cancel("Login Cancelled")
            process.exit(0);
        }
    }
    const AuthClient = createAuthClient({
        baseURL: serverUrl,
        plugins: [deviceAuthorizationClient()]
    })

    const spinner = yoctoSpinner({ text: "Requesting device authorization..." });
    spinner.start();

    try {
        const { data, error } = await AuthClient.device.code({
            client_id: clientID,
            scope: "openID profile email"
        })
        spinner.stop()

        if (error || !data) {
            logger.error(
                `Failed to request device authorization: ${error.error_description}`
            )

            process.exit(1)
        }

        const {
            device_code,
            user_code,
            verification_uri,
            verification_uri_complete,
            expires_in,
            interval = 5,
        } = data;

        console.log("Device Authorization Required")

        console.log(`Please visit ${chalk.underline.blue(verification_uri || verification_uri_complete)}`)

        console.log(`Enter Code: ${chalk.bold.green(user_code)}`)

        const shouldOpen = await confirm({
            message:"Open browser automatically",
            initialValue:true
        })

        if(!isCancel(shouldOpen) && shouldOpen){
            const urlToOpen=verification_uri || verification_uri_complete;
            await open(urlToOpen)
        }

        console.log(
            chalk.gray(
                `Waiting for authoriation (expires in ${Math.floor(
                expires_in / 60
            )} minutes)...`
            )
        );

    } catch (error) {

    }
}

//COMMANDER SETUP

export const login = new Command("login")
    .description("Login to Better Auth")
    .option("--server-url <url>", "The better Auth server URL", URL)
    .option("--client-id <id>", "The OAuth client ID", CLIENT_ID)
    .action(loginAction)