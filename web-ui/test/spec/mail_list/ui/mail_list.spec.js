/*global Smail */

describeComponent('mail_list/ui/mail_list', function () {
  'use strict';

  var mailList;

  beforeEach(function () {
    setupComponent('<div id="mails"></div>', {
      urlParams: {
        hasMailIdent: function () {
          return false;
        }
      }
    });
    mailList =
      [
        createMail('the mail subject', 'from@mail.com', '1', '2012-12-26T01:38:46-08:00'),
        createMail('another mail subject', 'from_another@mail.com', '2', '2012-12-28T01:38:46-08:00')
      ];
  });


  it('should open mail at first mail:available if there is a mailIdent in the url hash', function () {
    this.component.attr.urlParams = {
      hasMailIdent: function () {
        return true;
      },
      getMailIdent: function () {
        return '10';
      }
    };
    var openMailEvent = spyOnEvent(document, Smail.events.ui.mail.open);

    this.$node.trigger(Smail.events.mails.available, { mails: mailList });
    expect(openMailEvent).toHaveBeenTriggeredOnAndWith(document, { ident: '10' });

    this.$node.trigger(Smail.events.mails.available, { mails: mailList });
    expect(openMailEvent.calls.length).toEqual(1);
  });

  it('should push the state if there is a mail ident in the hash url', function () {
    this.component.attr.urlParams = {
      hasMailIdent: function () {
        return true;
      },
      getMailIdent: function () {
        return '10';
      }
    };
    var pushState = spyOnEvent(document, Smail.events.router.pushState);
    this.component.attr.currentTag = 'inbox';

    this.$node.trigger(Smail.events.mails.available, { mails: mailList });

    expect(pushState).toHaveBeenTriggeredOnAndWith(document, { tag: 'inbox', mailIdent: '10' });
  });

  describe('checking/unchecking mails in the list', function () {

    it('keeps a list with the currently checked mails', function () {
      var checkedMails = {};

      this.component.attr.checkedMails = {};

      $(document).trigger(Smail.events.ui.mail.checked, {mail: mailList[0]});

      checkedMails[mailList[0].ident] = mailList[0];

      expect(this.component.attr.checkedMails).toEqual(checkedMails);
    });

    it('returns the list of checked mails to whomever requests them', function () {
      var caller = {};
      this.component.attr.checkedMails = {'1': {}};
      var mailHereCheckedEvent = spyOnEvent(caller, Smail.events.ui.mail.hereChecked);

      $(document).trigger(Smail.events.ui.mail.wantChecked, caller);

      expect(mailHereCheckedEvent).toHaveBeenTriggeredOnAndWith(caller, { checkedMails: {'1': {} }});
    });

    it('returns an empty list to whomever requests the checked mails if there are no checked mails', function () {
      var caller = {};
      var mailHereCheckedEvent = spyOnEvent(caller, Smail.events.ui.mail.hereChecked);

      $(document).trigger(Smail.events.ui.mail.wantChecked, caller);

      expect(mailHereCheckedEvent).toHaveBeenTriggeredOnAndWith(caller, { checkedMails: {} });
    });

    it('removes for the checked mails when mail is unchecked', function () {
      this.component.attr.checkedMails = {
        '1': {},
        '2': {},
        '3': {}
      };

      $(document).trigger(Smail.events.ui.mail.unchecked, {mail: {ident: '1'}});

      expect(this.component.attr.checkedMails).toEqual({'2': {}, '3': {} });
    });

    it('checks the check all checkbox if at least one mail is checked', function () {
      var setCheckAllCheckboxEvent = spyOnEvent(document, Smail.events.ui.mails.hasMailsChecked);

      $(document).trigger(Smail.events.ui.mail.checked, {mail: mailList[0]});

      expect(setCheckAllCheckboxEvent).toHaveBeenTriggeredOnAndWith(document, true);
    });

    it('unchecks the check all checkbox if no mail is left checked', function () {
      this.component.attr.checkedMails = {1: {}};

      var setCheckAllCheckboxEvent = spyOnEvent(document, Smail.events.ui.mails.hasMailsChecked);

      $(document).trigger(Smail.events.ui.mail.unchecked, {mail: {ident: '1'}});

      expect(setCheckAllCheckboxEvent).toHaveBeenTriggeredOnAndWith(document, false);
    });
  });

  describe('when mails are available', function () {
    it('should open email if popstate event happened (when mailIdent isnt undefined)', function () {
      var openMailEvent = spyOnEvent(document, Smail.events.ui.mail.open);

      this.component.$node.trigger(Smail.events.mails.available, { mails: mailList, mailIdent: '30' });

      expect(openMailEvent).toHaveBeenTriggeredOnAndWith(document, { ident: '30'});
    });

    it('should open draft in popstate event if tag is Drafts', function () {
      var openDraftEvent = spyOnEvent(document, Smail.events.dispatchers.rightPane.openDraft);

      this.component.$node.trigger(Smail.events.mails.available, { mails: mailList, mailIdent: '30', tag: 'drafts' });

      expect(openDraftEvent).toHaveBeenTriggeredOnAndWith(document, { ident: '30'});
    });
  });

  it('should not append emails when another mails:available event is triggered', function () {
    this.component.$node.trigger(Smail.events.mails.available, { mails: mailList });

    expect(this.component.$node.find('a').length).toEqual(2);

    this.component.$node.trigger(Smail.events.mails.available, { mails: mailList });

    expect(this.component.$node.find('a').length).toEqual(2);
  });

  it('resets scroll when opening a new tag or choosing a new tag', function () {
    var eventSpy = spyOnEvent(document, Smail.events.dispatchers.middlePane.resetScroll);
    this.component.$node.trigger(Smail.events.mails.available, { mails: mailList });
    expect(eventSpy).toHaveBeenTriggeredOn(document);
  });

  describe('rendering the mails', function () {

    describe('when mails are available for refreshing', function () {
      it('renders the new mails', function () {
        this.component.$node.trigger(Smail.events.mails.availableForRefresh, { mails: mailList });

        matchMail(mailList[0], this.component.$node);
        matchMail(mailList[1], this.component.$node);
      });

    });

    it('should render all mails sent in ui:mails:show event', function () {
      this.component.$node.trigger(Smail.events.mails.available, { mails: mailList });

      matchMail(mailList[0], this.component.$node);
      matchMail(mailList[1], this.component.$node);
    });

    it('should select the current email when mails are available', function () {
      this.component.attr.currentMailIdent = '1';

      this.component.trigger(Smail.events.mails.available, { mails: mailList });

      matchSelectedMail(mailList[0], this.component.$node);
      matchMail(mailList[1], this.component.$node);
    });

    it('should keep the mail checked when it was previously checked (so refresh works)', function () {
      var checkbox, mailIdent;

      mailIdent = mailList[0].ident;
      this.component.attr.checkedMails[mailIdent] = mailList[0];
      this.component.$node.trigger(Smail.events.mails.available, { mails: [mailList[0]] });
      checkbox = this.$node.find('input[type=checkbox]');

      expect(checkbox.prop('checked')).toBe(true);
    });

    it('should render links for the emails', function () {
      this.component.$node.trigger(Smail.events.mails.available, { mails: mailList, tag: 'inbox' });

      expect(this.$node.html()).toMatch('href="/#/inbox/mail/1');
      expect(this.$node.html()).toMatch('href="/#/inbox/mail/2');
    });

    it('should clean the selected email', function () {
      this.component.attr.currentMailIdent = '1';
      this.component.trigger(Smail.events.ui.mails.cleanSelected);

      expect(this.component.attr.currentMailIdent).toEqual('');
    });

    function matchMail(mail, node) {
      expect(node.html()).toMatch('id="mail-' + mail.ident + '"');
      expect(node.html()).toMatch('<div class="subject-and-tags">');
      expect(node.html()).toMatch('<div class="from">' + mail.header.from + '</div>');
      expect(node.html()).toMatch('<span class="received-date">' + mail.header.formattedDate + '</span>');
    }

    function matchSelectedMail(mail, node) {
      expect(node.html()).toMatch(['id="mail-', mail.ident, '" class="selected"'].join(''));
    }
  });

  describe('when saving a draft', function () {
    it('refreshes the list if the current tag is drafts', function () {
      this.component.attr.currentTag = 'drafts';
      var spyRefresh = spyOnEvent(document, Smail.events.ui.mails.refresh);
      var spyScroll = spyOnEvent(document, Smail.events.dispatchers.middlePane.resetScroll);
      this.component.trigger(Smail.events.mail.draftSaved, {ident: 1});
      expect(spyRefresh).toHaveBeenTriggeredOn(document);
      expect(spyScroll).toHaveBeenTriggeredOn(document);
    });

    it('does not refresh the list if the current tag is not drafts', function() {
      this.component.attr.currentTag = 'sent';
      var spyRefresh = spyOnEvent(document, Smail.events.ui.mails.refresh);
      var spyScroll = spyOnEvent(document, Smail.events.dispatchers.middlePane.resetScroll);
      this.component.trigger(Smail.events.mail.draftSaved, {ident: 1});
      expect(spyRefresh).not.toHaveBeenTriggeredOn(document);
      expect(spyScroll).not.toHaveBeenTriggeredOn(document);
    });
  });

  describe('when sending a mail', function () {
    it('refreshes the list if the current tag is drafts', function () {
      this.component.attr.currentTag = 'drafts';
      var spyRefresh = spyOnEvent(document, Smail.events.ui.mails.refresh);
      var spyScroll = spyOnEvent(document, Smail.events.dispatchers.middlePane.resetScroll);
      this.component.trigger(Smail.events.mail.sent);
      expect(spyRefresh).toHaveBeenTriggeredOn(document);
      expect(spyScroll).toHaveBeenTriggeredOn(document);
    });

    it('refreshes the list if the current tag is sent', function() {
      this.component.attr.currentTag = 'sent';
      var spyRefresh = spyOnEvent(document, Smail.events.ui.mails.refresh);
      var spyScroll = spyOnEvent(document, Smail.events.dispatchers.middlePane.resetScroll);
      this.component.trigger(Smail.events.mail.sent);
      expect(spyRefresh).toHaveBeenTriggeredOn(document);
      expect(spyScroll).toHaveBeenTriggeredOn(document);
    });
  });

  function createMail(subject, from, ident, date) {
    var mail = Smail.testData().parsedMail.simpleTextPlain;

    return _.merge(mail, {
      header: {
        subject: subject,
        from: from,
        date: date
      },
      ident: ident,
      tags: ['inbox']
    });
  }
});