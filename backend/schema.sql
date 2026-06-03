--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_conversations (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    document_id uuid,
    model_name character varying(255),
    project_id uuid,
    title character varying(255),
    user_id uuid NOT NULL
);


ALTER TABLE public.ai_conversations OWNER TO postgres;

--
-- Name: ai_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_messages (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    content text,
    role character varying(255),
    token_count integer,
    conversation_id uuid,
    CONSTRAINT ai_messages_role_check CHECK (((role)::text = ANY ((ARRAY['USER'::character varying, 'ASSISTANT'::character varying, 'SYSTEM'::character varying])::text[])))
);


ALTER TABLE public.ai_messages OWNER TO postgres;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    code character varying(50) NOT NULL,
    description text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: document_chunks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_chunks (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    chunk_index integer,
    content text,
    document_id uuid
);


ALTER TABLE public.document_chunks OWNER TO postgres;

--
-- Name: document_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_tags (
    document_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


ALTER TABLE public.document_tags OWNER TO postgres;

--
-- Name: document_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_views (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    last_viewed_at timestamp(6) without time zone NOT NULL,
    document_id uuid NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.document_views OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    file_public_id character varying(255),
    description text,
    download_count integer,
    download_url character varying(255),
    file_size bigint,
    file_url character varying(255) NOT NULL,
    file_type character varying(255),
    original_file_name character varying(255),
    preview_url character varying(255),
    file_resource_type character varying(255),
    thumbnail_url character varying(255),
    title character varying(255) NOT NULL,
    visibility character varying(255) NOT NULL,
    course_id uuid NOT NULL,
    uploaded_by uuid NOT NULL,
    CONSTRAINT documents_visibility_check CHECK (((visibility)::text = ANY ((ARRAY['PUBLIC'::character varying, 'PRIVATE'::character varying])::text[])))
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: languages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.languages (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.languages OWNER TO postgres;

--
-- Name: project_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_documents (
    project_id uuid NOT NULL,
    document_id uuid NOT NULL
);


ALTER TABLE public.project_documents OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    description text,
    name character varying(255) NOT NULL,
    share_token character varying(255) NOT NULL,
    owner_id uuid NOT NULL
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id bigint NOT NULL,
    expiry_date timestamp(6) with time zone NOT NULL,
    token character varying(255) NOT NULL,
    user_id uuid
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    name character varying(255) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: schools; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schools (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    code character varying(255) NOT NULL,
    description character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.schools OWNER TO postgres;

--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    name character varying(80) NOT NULL
);


ALTER TABLE public.tags OWNER TO postgres;

--
-- Name: user_follow_courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_follow_courses (
    user_id uuid NOT NULL,
    course_id uuid NOT NULL
);


ALTER TABLE public.user_follow_courses OWNER TO postgres;

--
-- Name: user_languages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_languages (
    user_id uuid NOT NULL,
    language_id uuid NOT NULL
);


ALTER TABLE public.user_languages OWNER TO postgres;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_profiles (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    school_name character varying(255),
    school_code character varying(255),
    start_year integer,
    user_id uuid NOT NULL
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    avatar_url character varying(255),
    email character varying(255) NOT NULL,
    is_banned boolean NOT NULL,
    password character varying(255) NOT NULL,
    reset_token character varying(255),
    survey_completed boolean,
    email_verified boolean DEFAULT false,
    username character varying(255) NOT NULL,
    role_id uuid
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: ai_conversations ai_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT ai_conversations_pkey PRIMARY KEY (id);


--
-- Name: ai_messages ai_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: document_chunks document_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_chunks
    ADD CONSTRAINT document_chunks_pkey PRIMARY KEY (id);


--
-- Name: document_tags document_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT document_tags_pkey PRIMARY KEY (document_id, tag_id);


--
-- Name: document_views document_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_views
    ADD CONSTRAINT document_views_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: languages languages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (id);


--
-- Name: project_documents project_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_documents
    ADD CONSTRAINT project_documents_pkey PRIMARY KEY (project_id, document_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: courses uk_61og8rbqdd2y28rx2et5fdnxd; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT uk_61og8rbqdd2y28rx2et5fdnxd UNIQUE (code);


--
-- Name: users uk_6dotkott2kjsp8vw4d0m25fb7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);


--
-- Name: refresh_tokens uk_7tdcd6ab5wsgoudnvj7xf1b7l; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT uk_7tdcd6ab5wsgoudnvj7xf1b7l UNIQUE (user_id);


--
-- Name: projects uk_dxrwbgbn7v5gotfeo2r12fw43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT uk_dxrwbgbn7v5gotfeo2r12fw43 UNIQUE (share_token);


--
-- Name: user_profiles uk_e5h89rk3ijvdmaiig4srogdc6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT uk_e5h89rk3ijvdmaiig4srogdc6 UNIQUE (user_id);


--
-- Name: refresh_tokens uk_ghpmfn23vmxfu3spu3lfg4r2d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT uk_ghpmfn23vmxfu3spu3lfg4r2d UNIQUE (token);


--
-- Name: schools uk_m5x8j64nhdcprk9ghc6622swx; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT uk_m5x8j64nhdcprk9ghc6622swx UNIQUE (code);


--
-- Name: languages uk_myc139vxcejowe4q8qm3ca5jn; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT uk_myc139vxcejowe4q8qm3ca5jn UNIQUE (code);


--
-- Name: roles uk_ofx66keruapi6vyqpv6f2or37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT uk_ofx66keruapi6vyqpv6f2or37 UNIQUE (name);


--
-- Name: users uk_r43af9ap4edm43mmtq01oddj6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_r43af9ap4edm43mmtq01oddj6 UNIQUE (username);


--
-- Name: tags uk_t48xdq560gs3gap9g7jg36kgc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT uk_t48xdq560gs3gap9g7jg36kgc UNIQUE (name);


--
-- Name: document_views ukn8ieqfq0x7g7xwojppiteblqm; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_views
    ADD CONSTRAINT ukn8ieqfq0x7g7xwojppiteblqm UNIQUE (user_id, document_id);


--
-- Name: user_languages user_languages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_languages
    ADD CONSTRAINT user_languages_pkey PRIMARY KEY (user_id, language_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens fk1lih5y2npsf8u5o3vhdb9y0os; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT fk1lih5y2npsf8u5o3vhdb9y0os FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: documents fk1ugacya4ssi0ilf8a9tjycgs6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk1ugacya4ssi0ilf8a9tjycgs6 FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: user_languages fk3noekmeegvms77intl40sydai; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_languages
    ADD CONSTRAINT fk3noekmeegvms77intl40sydai FOREIGN KEY (language_id) REFERENCES public.languages(id);


--
-- Name: project_documents fk845kd34e1hofxb67dkr4nowqe; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_documents
    ADD CONSTRAINT fk845kd34e1hofxb67dkr4nowqe FOREIGN KEY (document_id) REFERENCES public.documents(id);


--
-- Name: document_tags fkaurbdl9yo1wsoereckcwejrxs; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT fkaurbdl9yo1wsoereckcwejrxs FOREIGN KEY (tag_id) REFERENCES public.tags(id);


--
-- Name: document_tags fkc99c5qjulwx9gru07yrhicgd2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT fkc99c5qjulwx9gru07yrhicgd2 FOREIGN KEY (document_id) REFERENCES public.documents(id);


--
-- Name: project_documents fkfu1nh0td6ql5va3viuej44opf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_documents
    ADD CONSTRAINT fkfu1nh0td6ql5va3viuej44opf FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: user_profiles fkjcad5nfve11khsnpwj1mv8frj; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT fkjcad5nfve11khsnpwj1mv8frj FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: projects fkmueqy6cpcwpfl8gnnag4idjt9; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT fkmueqy6cpcwpfl8gnnag4idjt9 FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: user_follow_courses fkovat7uqxqehvmgykocrnb5xhw; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_follow_courses
    ADD CONSTRAINT fkovat7uqxqehvmgykocrnb5xhw FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users fkp56c1712k691lhsyewcssf40f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fkp56c1712k691lhsyewcssf40f FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: document_views fkqpbtiurxbjreve0c1tdnmksyx; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_views
    ADD CONSTRAINT fkqpbtiurxbjreve0c1tdnmksyx FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: document_views fkr238frml7nup3p1qmn2lv3jb2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_views
    ADD CONSTRAINT fkr238frml7nup3p1qmn2lv3jb2 FOREIGN KEY (document_id) REFERENCES public.documents(id);


--
-- Name: user_follow_courses fks77ll25jxk54c65l0wfwbgy1p; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_follow_courses
    ADD CONSTRAINT fks77ll25jxk54c65l0wfwbgy1p FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: documents fksuenl009odnidqiyaao22gw0s; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fksuenl009odnidqiyaao22gw0s FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: user_languages fkt3sjkb7b30p03i378qdcr2s9k; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_languages
    ADD CONSTRAINT fkt3sjkb7b30p03i378qdcr2s9k FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: ai_messages fktq1w3mm8r0ioqoyvvxjs765jf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT fktq1w3mm8r0ioqoyvvxjs765jf FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id);


--
-- PostgreSQL database dump complete
--

