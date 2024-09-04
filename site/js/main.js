document.addEventListener("DOMContentLoaded", function () {
    Prism.hooks.add('wrap', annotate);
    fetch('result.json', { cache: "no-cache" })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            appendData(data);
            Prism.highlightAll();
        })
        .catch(function (err) {
            console.log(err);
        });
});

function appendData(data) {
    var mainContainer = document.getElementById("data");

    document.getElementById("log_url").href = `https://github.com/${data.github_repository}/actions/runs/${data.github_run_id}#step:3:4`;
    document.getElementById("run_date").textContent = `last update:  ${data.github_run_date}`;
    document.getElementById("source_repo").href = `https://github.com/${data.github_repository}`;

    for (var i = 0; i < data.result.length; i++) {
        const template = document.querySelector("#config-block-template");
        const configBlockEl = template.content.cloneNode(true);
        const configNameEl = configBlockEl.querySelector("h2");
        const configCodeEl = configBlockEl.querySelector("code");

        const configName = data.result[i].domain || 'unknown';
        const configCode = JSON.stringify(data.result[i], null, 2);

        configNameEl.id = configName;
        configNameEl.textContent = configName;
        configCodeEl.textContent = configCode;

        const validation = validate(data.result[i]);
        configNameEl.classList.add(validation.class);
        if (validation.class == 'ok') {
          configNameEl.title = 'Configuration is valid.';
        } else if (validation.class == 'error') {
          configNameEl.title = 'There are problems with this configuration.';
          console.log(`Problems with ${configName} config`, validation.details);
        } else if (validation.class == 'warning') {
          configNameEl.title = 'There are concerns with this configuration.';
          console.log(`Warnings with ${configName} config`, validation.details);
        }

        mainContainer.appendChild(configBlockEl);
    }
}

// Generate a generic log message object.
function report(type, message) {
  return {
    type: type,
    message: message
  };
}

// Log message objects of specific types.
function warning(message) {
  return report('warning', message);
}
function error(message) {
  return report('error', message);
}

// Validate a result stanza and return an appropriate class name
// to decorate the entry.
function validate(config) {
  let reports = []

  // Verify all the necessary properties are present.
  const expected = ['domain', 'modified_on', 'protocol', 'proxy_protocol', 'traffic_type'];
  expected.forEach(property => {
    if (!config[property]) {
      reports.push(error(`Missing property '${property}'`));
    }
  });

  // Verify properties have the expected values.
  const domain = config.domain || 'unknown';
  if (config.protocol != 'tcp/443') {
    reports.push(error(`${domain} not configured for https traffic`));
  } 
  if (config.proxy_protocol != 'off') {
    reports.push(error(`${domain} configured to forward client IP addresses`));
  }
  if (config.traffic_type != 'direct') {
    reports.push(error(`${domain} configured to terminate encryption at the proxy`));
  }

  // Warn about recent changes.
  const modDate = new Date(config.modified_on);
  const elapsed_hours = (Date.now() - modDate) / 1000 / 3600;
  if (elapsed_hours < 60) {
    reports.push(warning('Configuration modified recently'));
  }

  // Summarize reports to an overall validation status.
  let status;
  if (reports.length == 0) {
    // Empty array means successful validation.
    status = 'ok';
  } else if (reports.some(report => report.type == 'error')) {
    // One or more errors mark the config with error.
    status = 'error';
  } else {
    // Another other reports are cause for attention.
    status = 'warning';
  }

  return {
    class: status,
    details: reports
  };
}

// Annotate the various elements with descriptive tooltips.
// This is a bit brittle since it doesn't look at the whole
// line, just the tokenized json values.
function annotate(env) {
  if (env.type == 'string') {
    if (env.content.includes('tcp/80')) {
      env.attributes['title'] = '❌ accepts unencrypted HTTP traffic';
      env.classes.push('hint');
    } else if (env.content.includes('tcp/443')) {
      env.attributes['title'] = '✅ HTTPS traffic';
    } else if (env.content == '"on"') {
      env.attributes['title'] = '❌ client IP address forwarded to Brave';
      env.classes.push('hint');
    } else if (env.content == '"off"') {
      env.attributes['title'] = '✅ client IP address stripped';
    } else if (env.content == '"direct"') {
      env.attributes['title'] = '✅ traffic forwarded without inspection';
    }
  }
}
