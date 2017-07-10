var https = require('https');
// This is the campaign that will be replicated and sent again
var originalCampaignId = 'bcb874b410';
console.log('starting function')
exports.handle = function(e, ctx, cb) {
	console.log('processing event: %j', e)

	// An object of options to indicate where to post to
	var post_options = {
		host: 'us15.api.mailchimp.com',
		port: '443',
		path: '/3.0/campaigns/' + originalCampaignId + '/actions/replicate',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength('{}'),
			'Authorization': process.env.MAILCHIMP_APIKEY
		}
	};

	var req = https.request(post_options, function(res) {
		console.log("Replicate Status: " + res.statusCode);
		var data = [];
		res.on('data', function(chunk) {
			data.push(chunk);
		});
		res.on('errors', function(e) {
			console.error(e);
			cb(e);
		});
		res.on('end', function() {
			var result = JSON.parse(data.join(''))
			var newCampaignId = result.id;

			var post_options = {
				host: 'us15.api.mailchimp.com',
				port: '443',
				path: '/3.0/campaigns/' + newCampaignId + '/actions/send',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength('{}'),
					'Authorization': process.env.MAILCHIMP_APIKEY
				}
			};

			var sendActionRequest = https.request(post_options, function(sendActionResponse) {
				console.log("Send Status: " + sendActionResponse.statusCode);

				var data = [];
				sendActionResponse.on('data', function(chunk) {
					data.push(chunk);
				});
				sendActionResponse.on('errors', function(e) {
					console.error(e);
					cb(e);
				});
				sendActionResponse.on('end', function() {
					console.log('sent campaign');
				});
			});
			sendActionRequest.write('{}');
			sendActionRequest.end();
		});
	});

	req.write('{}');
	req.end();

	cb(null, { campaign_status: 'sent' });
}

exports.handle(null, null, function() {
	console.log('finished');
});
