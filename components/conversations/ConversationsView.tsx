"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Button, Flex, Text, Spinner, Badge, TextField } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone, ArrowLeft } from "lucide-react";
import { fetchContacts, fetchMessages } from "@/lib/api-client";
import { BRAND_ORANGE } from "@/lib/constants";
import type { Contact, Message } from "@/lib/types";

type FilterKey = "hoy" | "ayer" | "semana" | "mes";

const FILTER_LABELS: Record<FilterKey, string> = {
  hoy: "Hoy",
  ayer: "Ayer",
  semana: "Semana",
  mes: "Mes",
};

export function ConversationsView() {
  const [filter, setFilter] = useState<FilterKey>("hoy");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ["contacts", filter],
    queryFn: () => fetchContacts(filter),
    refetchInterval: 10000,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", selectedPhone],
    queryFn: () => fetchMessages(selectedPhone!),
    enabled: !!selectedPhone,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSelectContact = (phone: string) => {
    setSelectedPhone(phone);
    setShowChat(true);
  };

  const handleBackToContacts = () => {
    setShowChat(false);
  };

  const filteredContacts = contacts.filter(
    (c) =>
      !search.trim() ||
      c.phone_number.includes(search) ||
      c.last_message.toLowerCase().includes(search.toLowerCase())
  );

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  };

  const formatMessageTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };

  const ContactsList = (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#fff",
        borderRight: "1px solid #ffe0b2",
      }}
    >
      {/* Filters */}
      <Flex gap="1" p="3" style={{ borderBottom: "1px solid #ffe0b2", flexShrink: 0 }} wrap="wrap">
        {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
          <Button
            key={key}
            size="1"
            variant={filter === key ? "solid" : "soft"}
            color="orange"
            onClick={() => setFilter(key)}
            style={{ cursor: "pointer" }}
          >
            {FILTER_LABELS[key]}
          </Button>
        ))}
      </Flex>

      {/* Search */}
      <Box px="3" py="2" style={{ borderBottom: "1px solid #ffe0b2", flexShrink: 0 }}>
        <TextField.Root
          placeholder="Buscar contacto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="2"
        >
          <TextField.Slot>
            <Search size={14} />
          </TextField.Slot>
        </TextField.Root>
      </Box>

      {/* Contacts */}
      <Box style={{ flex: 1, overflowY: "auto" }}>
        {loadingContacts ? (
          <Flex justify="center" py="6">
            <Spinner size="2" />
          </Flex>
        ) : filteredContacts.length === 0 ? (
          <Flex justify="center" py="6">
            <Text color="gray" size="2">Sin contactos</Text>
          </Flex>
        ) : (
          filteredContacts.map((contact) => (
            <Box
              key={contact.phone_number}
              onClick={() => handleSelectContact(contact.phone_number)}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #fff5e6",
                cursor: "pointer",
                background:
                  selectedPhone === contact.phone_number ? "#fff5e6" : "transparent",
                transition: "background 0.15s",
              }}
            >
              <Flex justify="between" align="start" gap="2">
                <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
                  <Flex
                    align="center"
                    justify="center"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#fff5e6",
                      flexShrink: 0,
                    }}
                  >
                    <Phone size={16} color={BRAND_ORANGE} />
                  </Flex>
                  <Flex direction="column" style={{ minWidth: 0 }}>
                    <Text size="2" weight="medium" style={{ fontFamily: "monospace" }}>
                      {contact.phone_number}
                    </Text>
                    <Text
                      size="1"
                      color="gray"
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {contact.last_message}
                    </Text>
                  </Flex>
                </Flex>
                <Flex direction="column" align="end" gap="1" style={{ flexShrink: 0 }}>
                  <Text size="1" color="gray">
                    {formatTimestamp(contact.last_message_at)}
                  </Text>
                  <Badge color="orange" variant="soft" size="1">
                    {contact.message_count}
                  </Badge>
                </Flex>
              </Flex>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );

  const ChatPanel = (
    <Flex
      direction="column"
      style={{
        height: "100%",
        background: "linear-gradient(180deg, #fffdfa 0%, #fff5e6 100%)",
      }}
    >
      {!selectedPhone ? (
        <Flex align="center" justify="center" style={{ flex: 1 }}>
          <Flex direction="column" align="center" gap="2">
            <Phone size={40} color="#ffd0a0" />
            <Text color="gray" size="3">
              Selecciona un contacto
            </Text>
          </Flex>
        </Flex>
      ) : (
        <>
          {/* Chat header */}
          <Flex
            align="center"
            gap="2"
            px="3"
            style={{
              height: 56,
              background: "#fff",
              borderBottom: "1px solid #ffe0b2",
              flexShrink: 0,
            }}
          >
            {/* Back button — mobile only */}
            <Button
              variant="ghost"
              color="gray"
              size="2"
              onClick={handleBackToContacts}
              style={{ cursor: "pointer", display: "none" }}
              className="mobile-back-btn"
            >
              <ArrowLeft size={18} />
            </Button>
            <Phone size={18} color={BRAND_ORANGE} />
            <Text weight="bold" size="3" style={{ fontFamily: "monospace" }}>
              {selectedPhone}
            </Text>
          </Flex>

          {/* Messages */}
          <Box style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {loadingMessages ? (
              <Flex justify="center" py="6">
                <Spinner size="2" />
              </Flex>
            ) : messages.length === 0 ? (
              <Flex justify="center" py="6">
                <Text color="gray" size="2">Sin mensajes</Text>
              </Flex>
            ) : (
              <Flex direction="column" gap="2">
                {messages.map((msg, i) => {
                  const isAssistant = msg.role === "assistant";
                  return (
                    <Flex key={i} justify={isAssistant ? "end" : "start"}>
                      <Box
                        style={{
                          maxWidth: "80%",
                          padding: "10px 14px",
                          borderRadius: isAssistant
                            ? "18px 18px 4px 18px"
                            : "18px 18px 18px 4px",
                          background: isAssistant ? BRAND_ORANGE : "#fff",
                          color: isAssistant ? "#fff" : "#333",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                          border: isAssistant ? "none" : "1px solid #ffe0b2",
                        }}
                      >
                        <Text size="2" style={{ wordBreak: "break-word" }}>
                          {msg.message}
                        </Text>
                        <Text
                          size="1"
                          style={{
                            display: "block",
                            textAlign: "right",
                            marginTop: 4,
                            opacity: 0.7,
                          }}
                        >
                          {formatMessageTime(msg.created_at)}
                        </Text>
                      </Box>
                    </Flex>
                  );
                })}
                <div ref={messagesEndRef} />
              </Flex>
            )}
          </Box>
        </>
      )}
    </Flex>
  );

  return (
    <>
      <style>{`
        .conv-container {
          display: flex;
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }
        .conv-contacts {
          width: 320px;
          min-width: 280px;
          flex-shrink: 0;
          height: 100%;
        }
        .conv-chat {
          flex: 1;
          min-width: 0;
          height: 100%;
        }
        @media (max-width: 640px) {
          .conv-contacts {
            width: 100%;
            min-width: 0;
            display: ${showChat ? "none" : "block"};
          }
          .conv-chat {
            display: ${showChat ? "flex" : "none"};
            flex-direction: column;
          }
          .mobile-back-btn {
            display: flex !important;
          }
        }
      `}</style>

      <div className="conv-container">
        <div className="conv-contacts">{ContactsList}</div>
        <div className="conv-chat">{ChatPanel}</div>
      </div>
    </>
  );
}
