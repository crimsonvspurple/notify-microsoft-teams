const core = require('@actions/core');
const MSTeams = require('./MSTeams');

const missing_functionality_warning = objective =>
	core.warning(`Missing ${objective} parameter will result in reduced functionality.`) || {};

const access_context = context_name => {
	let context = core.getInput(context_name);
	if (!context) missing_functionality_warning(context_name);
	return context === '' ? {} : JSON.parse(context);
};

async function run() {
	try {
		const webhook_url = process.env.MSTEAMS_WEBHOOK || core.getInput('webhook_url');
		if (webhook_url === '') {
			throw new Error(
				'[Error] Missing Microsoft Teams Incoming Webhooks URL.\n' +
				'Please configure "MSTEAMS_WEBHOOK" as environment variable or\n' +
				'specify the key called "webhook_url" in "with" section.'
			);
		}

		let job = access_context('job');
		let steps = access_context('steps');
		let needs = access_context('needs');

		let title = core.getInput('title');
		let msteams_emails= core.getInput('msteams_emails');
		let raw = core.getInput('raw');
		let dry_run = core.getInput('dry_run');
		let localized_datetime = core.getInput('localized_datetime');

		core.info(`Parsed params:\n${JSON.stringify({
			webhook_url: '***',
			job,
			steps,
			needs,
			raw,
			title,
			msteams_emails,
			dry_run,
			localized_datetime
		})}`);

		const msteams = new MSTeams();
		let payload;
		if (raw === '') {
			payload = await msteams.generatePayload(
				{
					job,
					steps,
					needs,
					title,
					msteams_emails,
					localized_datetime
				}
			);
		} else {
			payload = Object.assign({}, msteams.header, JSON.parse(raw));
		}

		core.info(`Generated payload for Microsoft Teams:\n${JSON.stringify(payload, null, 2)}`);

		if (dry_run === '' || dry_run==='false') {
			await msteams.notify(webhook_url, payload);
			core.info('Sent message to Microsoft Teams');
		} else {
			core.info('Dry run - skipping notification send. Done.');
		}
	} catch (err) {
		core.setFailed(err.message);
	}
}

if (require.main === module) {
	run();
} else {
	exports.run = run;
}
