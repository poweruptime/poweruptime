# Email

A live preview right in your browser, so you don't need to keep sending real emails during development.

## Getting Started

Run the development server:

`emails` directory:

```sh
pnpm start
```

`root` directory:

```sh
pnpm emails:start
```

Open [localhost:3000](http://localhost:3000) with your browser to see the result.

## Export

> E-Mails are automatically exported during backend build.

## Adding a new email

1. Create a new email in the [emails](./emails) folder. `your-email.tsx`
2. Develop your new email. Take inspiration from the other E-Mails how parsing and link manipulation is done.
   `./gradlew npm_start` and go to [`localhost:3000`](http://localhost:3000) to preview it.
3. When you're done, run `./gradlew npm_run_format` to format the emails root folder and `./gradlew exportEmails` to
   export the HTML of your newly created email.
4. Now there should be a newly created `your-email.html` file
   in [backend/src/main/resources/templates/html](../backend/src/main/resources/templates/html).
5. **Create your TEXT email now in
   ** [backend/src/main/resources/templates/txt](../backend/src/main/resources/templates/txt) with the same name. for
   example: `your-email.txt`
6. Now create your Kotlin E-Mail
   in [backend/src/main/kotlin/org/poweruptime/backend/features/mail/emails](../backend/src/main/kotlin/org/poweruptime/backend/features/mail/emails)
   ```kotlin
   class YourEmail(email: String, password: String, firstname: String) : Email {
      override val to = listOf(email)
      override val subject = "Dein E-Mail Subjekt"
      override val templateName = "your-email" //IMPORTANT
      override val context = Context().apply {
          setVariable("email", email) // All variables you need in your template.
      }
   }
   ```
7. Now you can use this E-Mail from wherever you want.

   ```kotlin
   @Service
   class UserService(
       val emailService: EmailService,
   )

   emailService.queueEmail(
       YourEmail(
           email = "",
           password = "",
           firstname = ""
       )
   )
   ```

> You may not add the generated html mail to git, the html templates will automatically be generated at build time.
> The txt mails however must be checked in.
