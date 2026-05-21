import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useSelector } from "react-redux";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    question: "How do I place an order?",
    answer:
      "Choose your food items, add them to cart, confirm your delivery address and place the order using Cash on Delivery.",
  },
  {
    question: "Can I cancel or return my order?",
    answer:
      "Once an order is placed, it cannot be cancelled or returned. Please review your order carefully before confirming.",
  },
  {
    question: "What payment methods are available?",
    answer:
      "Currently, Hatari supports Cash on Delivery (COD) only.",
  },
  {
    question: "Who delivers my order?",
    answer:
      "All orders are delivered by Hatari’s own delivery partners to ensure safe and timely delivery.",
  },
  {
    question: "How do I contact customer support?",
    answer:
      "You can contact us via call, email or WhatsApp directly from this screen.",
  },
];

// ...same imports and FAQS...

export default function SupportHelpScreen() {

  const [activeIndex, setActiveIndex] = useState(null);

const selectedRestaurant = useSelector(
  state => state.experience.selectedRestaurant
);

console.log(selectedRestaurant, "------Support------");

const supportNumber =
  selectedRestaurant?.supportContact?.mobileNumber || "0000000000";

const managerName =
  selectedRestaurant?.supportContact?.managerName || "Hatari Support";


  const toggleFAQ = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={{ marginVertical: 20 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Help & Support</Text>
          <Text style={styles.subtitle}>
            We are here to help you with your Hatari orders
          </Text>
        </View>

        {/* Quick Help */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Help</Text>

          <HelpItem text="Order & Delivery Information" />
          <HelpItem text="Cash on Delivery (COD)" />
          <HelpItem text="No Cancellation / No Return Policy" />
          <HelpItem text="Account & Profile Support" />
        </View>

        {/* Contact Support */}
      {/* Contact Support */}
<View style={styles.card}>
  <Text style={styles.sectionTitle}>Contact Us</Text>

 

  <ContactButton
    text={`📞 Call ${managerName}`}
    onPress={() =>
      Linking.openURL(`tel:+91${supportNumber}`)
    }
  />

  <ContactButton
    text="✉️ Email Support"
    onPress={() =>
      Linking.openURL("mailto:hatari.app1966@gmail.com")
    }
  />

  <ContactButton
    text={`💬 WhatsApp ${managerName}`}
    onPress={() =>
      Linking.openURL(`https://wa.me/91${supportNumber}`)
    }
  />
</View>

        {/* Important Policy */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Important Policy</Text>
          <View style={{ marginTop: 8 }}>
            <PolicyBullet text="Cash on Delivery (COD) only" />
            <PolicyBullet text="Orders once placed cannot be cancelled" />
            <PolicyBullet text="No return or refund after delivery" />
            <PolicyBullet text="Delivery handled by Hatari’s own delivery team" />
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>FAQs</Text>

          {FAQS.map((item, index) => (
            <View
              key={index}
              style={[
                styles.faqCard,
                activeIndex === index && { borderColor: "#E53935", borderWidth: 1 },
              ]}
            >
              <TouchableOpacity onPress={() => toggleFAQ(index)}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
              </TouchableOpacity>

              {activeIndex === index && (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: "#E53935" }]}>Hatari Food App</Text>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>

      </View>
    </ScrollView>
  );
}

const HelpItem = ({ text }) => (
  <View style={styles.helpItem}>
    <View style={styles.dot} />
    <Text style={styles.helpText}>{text}</Text>
  </View>
);

const ContactButton = ({ text, onPress }) => (
  <TouchableOpacity style={styles.contactBtn} onPress={onPress}>
    <Text style={styles.contactText}>{text}</Text>
  </TouchableOpacity>
);

const PolicyBullet = ({ text }) => (
  <View style={styles.policyBullet}>
    <View style={styles.policyDot} />
    <Text style={styles.policyText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDECEC",
    padding: 16,
  },

  header: {
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#E53935",
  },

  subtitle: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E53935",
    marginBottom: 14,
  },

  helpItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E53935",
    marginRight: 10,
  },

  helpText: {
    fontSize: 15,
    color: "#333",
  },

  contactBtn: {
    backgroundColor: "#E53935",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },

  contactText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  policyBullet: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },

  policyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E53935",
    marginRight: 10,
    marginTop: 4,
  },

  policyText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    flex: 1,
  },

  faqCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  faqQuestion: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },

  faqAnswer: {
    fontSize: 14,
    color: "#555",
    marginTop: 8,
    lineHeight: 20,
  },

  footer: {
    alignItems: "center",
    marginVertical: 30,
  },

  footerText: {
    fontSize: 13,
    color: "#777",
  },
});

