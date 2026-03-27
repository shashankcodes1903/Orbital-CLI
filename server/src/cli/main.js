#!/usr/bin/env node

import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet"
import {Command} from "commander";
import { login} from "./commands/auth/login.js";

dotenv.config();

async function main() {
    //Display Banner 
    console.log(
        chalk.cyan(
            figlet.textSync("Orbital CLI" , {
                font:"Standard",
                horizontalLayout:"default"
            })
        )
    )
    console.log(chalk.red("A cli based AI tool \n"))

    const program=new Command("orbital");
    program.version("0.0.1")
    .description("Orbital CLI - A CLI based AI Tool")
    .addCommand(login)

    program.action(()=>{
        program.help();
    });

    program.parse();
}

main().catch((err)=>{
    console.log(chalk.red("Error running Orbital CLI:"), err)
    process.exit(1)
})
