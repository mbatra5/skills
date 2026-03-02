Feature: Button - DataLayer Analytics

  @analytics @button @ctaClick @critical
  Scenario: Verify cta_click event on primary button click
    Given I am on the "button" analytics "primaryButton" page
    When I click the primary button
    Then the dataLayer should contain expected "cta_click" event

  @analytics @button @selectContent
  Scenario: Verify select_content event on button click
    Given I am on the "button" analytics "primaryButton" page
    When I click the primary button
    Then the dataLayer should contain expected "select_content" event
