const mongoose = require("mongoose");
const _ = require("lodash");
const Path = require("path-parser").default;
const { URL } = require("url");
const requireLogin = require("../middlewares/requireLogin");
const requireCredits = require("../middlewares/requireCredits");
const Mailer = require("../services/Mailer");

const Survey = mongoose.model("surveys");
const surveyTemplate = require("../services/emailTemplates/surveyTemplate");

module.exports = app => {
	app.get("/api/surveys/:surveyId/:feedback", (req, res) => {
		res.send("Thanks for your feedback!");
	});

	app.get("/api/surveys", requireLogin, async (req, res) => {
		const surveys = await Survey.find({ _user: req.user.id })
			.select({ recipients: false });
			
		res.send(surveys);
	});

	app.post("/api/surveys/webhooks", (req, res) => {
		const parser = new Path("/api/surveys/:surveyId/:feedback");
		
		_.chain(req.body)	
			.map(({ url, email }) => {
				const match = parser.test(new URL(url).pathname);
				if (match) {
					return { email: email, surveyId: match.surveyId, feedback: match.feedback };
				}
			})
			.compact()
			.uniqBy("email", "surveyId")
			.each(({ surveyId, email, feedback }) => {
				Survey.updateOne({
					_id: surveyId,
					recipients: {
						$elemMatch: { email: email, responded: false }
					}
				}, {
					$inc: { [feedback]: 1 },
					$set: { "recipients.$.responded": true },
					lastResponded: new Date()
				}).exec();
			})
			.value();

		res.send({});
	});

	app.post("/api/surveys", requireLogin, requireCredits, async (req, res) => {
		const { title, subject, body, recipients } = req.body;

		const survey = new Survey({
			title,
			subject,
			body,
			recipients: recipients.split(",").map(email => ({ email: email.trim() })),
			_user: req.user.id,
			dateSent: Date.now()		
		});

		const mailer = new Mailer(survey, surveyTemplate(survey));
		
		try {
			await mailer.send();
			await survey.save();
			req.user.credits -= 1;
			const user = await req.user.save();

			res.send(user);
		} catch(err) {
			res.status(422).send(err);
		}
	});
};